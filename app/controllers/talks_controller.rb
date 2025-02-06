class TalksController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:notify]

  def index
    @talk_settings = {
      admin_only_creation_description: Settings::Talk.admin_only_creation,
      allow_anonymous_listening_description: Settings::Talk.allow_anonymous_listening,
    }
  end

  def active
    @talks = Talk.includes(:user)
                 .where("status = ? OR (status = ? AND end_date >= ?)", 
                       Talk.statuses[:started], Talk.statuses[:finished], 1.minute.ago)
                 .select(:id, :start_date, :title, :user_id, :channel_id, :status)

    render json: @talks, 
           only: [:id, :title, :start_date, :channel_id, :status], 
           include: { 
             user: { 
               only: [:username, :id],
               methods: [:profile_image_90]
             } 
           }, 
           status: :ok
  end

  def notify
    payload = JSON.parse(request.body.read)
    
    event_type = payload["eventType"]
    return render json: { success: true }, status: :ok unless [101, 102].include?(event_type)

    channel_name = payload.dig("payload", "channelName")
    if talk = Talk.find_by(channel_id: channel_name)
      return render json: { success: true }, status: :ok if talk.banned?

      if event_type == 101
        talk.update!(status: :started) unless talk.started?
      else # event_type == 102
        talk.update!(status: :finished, end_date: Time.current) unless talk.finished?
      end
    end
    
    render json: { success: true }, status: :ok
  rescue StandardError => e
    Rails.logger.error "Error processing webhook: #{e.message}"
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def create
    unless current_user
      return render json: { error: 'You must be logged in' }, status: :unauthorized
    end
    
    if current_user.talks.where(status: Talk.statuses[:started]).exists?
      return render json: { error: 'You already have an active transmission' }, status: :unprocessable_entity
    end
    
    @talk = Talk.new(talk_params)
    @talk.user = current_user
    @talk.start_date ||= Time.current
    authorize @talk
    token_response = Talks::GenerateToken.call(current_user)
    
    channel_response = Talks::CreateChannel.call(
      title: @talk.title,
      token: token_response['token']
    )
    
    @talk.channel_id = channel_response.channel_id
    @talk.host_id = channel_response.host_id
    @talk.viewer_id = channel_response.viewer_id

    if @talk.save
      render json: { 
        token: token_response['token'],
        host_id: channel_response.host_id,
        username: current_user.username,
        talk_id: @talk.id,
        channel_id: channel_response.channel_id
      }, status: :created
    else
      render json: { errors: @talk.errors }, status: :unprocessable_entity
    end
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def join
    @talk = Talk.find_by!(channel_id: params[:id])
    
    if @talk.banned?
      return render json: { error: 'This channel has been banned' }, status: :forbidden
    end

    if @talk.started? && @talk.start_date < 2.hours.ago
      return render json: { error: 'Channel has exceeded maximum duration (2 hours)' }, status: :forbidden
    end

    unless current_user || Settings::Talk.allow_anonymous_listening
      return render json: { error: 'You must be logged in to join the conversation' }, status: :unauthorized
    end

    username = if current_user
                current_user.username
              else
                "anonim_#{SecureRandom.hex(4)}"
              end

    user_for_token = current_user || OpenStruct.new(username: username)
    token_response = Talks::GenerateToken.call(user_for_token)

    access = if current_user && @talk.user_id == current_user.id
                   @talk.host_id
                 else
                   @talk.viewer_id
                 end

    render json: { 
      token: token_response['token'],
      channel_id: @talk.channel_id,
      access: access,
      username: username,
      video: @talk.video
    }, status: :ok
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Talk not found' }, status: :not_found
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def scheduled
    @talks = Talk.includes(:user)
                 .where(status: Talk.statuses[:created])
                 .select(:id, :start_date, :title, :user_id, :channel_id)
                 .where("start_date >= ?", Time.current)
                 .order(start_date: :asc)
                     
    render json: @talks.map { |talk| 
      talk.as_json(
        only: [:id, :title, :start_date],
        include: { 
          user: { 
            only: [:username, :id],
            methods: [:profile_image_90]
          } 
        }
      ).merge(
        scheduled_channel_id: talk.scheduled_channel_id(current_user)
      )
    }, status: :ok
  end

  def destroy
    @talk = Talk.find(params[:id])
    authorize @talk
    
    if @talk.update(status: :removed)
      render json: { success: true }, status: :ok
    else
      render json: { errors: @talk.errors }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Talk not found' }, status: :not_found
  end

  private

  def talk_params
    params.require(:talk).permit(:title, :start_date, :video)
  end
end 
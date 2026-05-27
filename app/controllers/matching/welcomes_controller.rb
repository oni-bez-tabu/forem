module Matching
  # POST /matching/welcomes — sender wysyła powitanie do innego matching
  # profilu w kontekście konkretnego meetupu. Zgodnie z decyzją POC:
  # brak identity filter (R1), tylko unique pair + R-Lifecycle 48h + obie
  # deklaracje aktywne (intent != not_looking).
  class WelcomesController < ApplicationController
    before_action :authenticate_user!
    before_action :load_sender_profile
    before_action :require_active_sender
    before_action :load_meetup
    before_action :require_within_lifecycle
    before_action :load_receiver_profile
    before_action :require_distinct_receiver
    before_action :require_visible_receiver
    before_action :require_both_declarations_active
    before_action :reject_duplicate_welcome

    def create
      welcome = MatchingWelcome.new(
        sender_profile: @sender_profile,
        receiver_profile: @receiver_profile,
        meetup: @meetup,
        sent_at: Time.current,
      )

      if welcome.save
        body = MatchingWelcome.render_body(
          sender_profile: @sender_profile,
          meetup: @meetup,
          host: request.host,
        )
        delivery = Matching::DeliverWelcomeViaCloudFunction.call(welcome: welcome, body: body)

        render json: {
          status: "ok",
          welcome_id: welcome.id,
          delivery: delivery[:status]
        }, status: :created
      else
        render json: { status: "error", errors: welcome.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def load_sender_profile
      @sender_profile = MatchingProfile.find_by(user_id: current_user.id)
    end

    def require_active_sender
      return if @sender_profile&.visible_to_others?

      render json: { status: "error", error: "sender_profile_inactive" }, status: :forbidden
    end

    def load_meetup
      @meetup = Meetup.find_by(id: params[:meetup_id])
      raise ActiveRecord::RecordNotFound unless @meetup
    end

    # R-Lifecycle.2: welcome blocked once event-scoped profile expires (48h after end_at).
    def require_within_lifecycle
      return if @meetup.end_at + Matching::EventScopedProfilesController::EVENT_SCOPED_LIFETIME > Time.current

      raise ActiveRecord::RecordNotFound
    end

    def load_receiver_profile
      @receiver_profile = MatchingProfile.find_by(id: params[:receiver_profile_id])
      raise ActiveRecord::RecordNotFound unless @receiver_profile
    end

    def require_distinct_receiver
      return if @receiver_profile.id != @sender_profile.id

      render json: { status: "error", error: "cannot_welcome_self" }, status: :unprocessable_entity
    end

    def require_visible_receiver
      return if @receiver_profile.visible_to_others?

      raise ActiveRecord::RecordNotFound
    end

    # Both sides must have a declaration on this meetup with intent != not_looking (R4).
    def require_both_declarations_active
      sender_dec = MeetupMatchingDeclaration.find_by(meetup_id: @meetup.id, matching_profile_id: @sender_profile.id)
      receiver_dec = MeetupMatchingDeclaration.find_by(meetup_id: @meetup.id, matching_profile_id: @receiver_profile.id)

      both_intend_to_meet = sender_dec.present? && receiver_dec.present? &&
        sender_dec.intent_level != "not_looking" &&
        receiver_dec.intent_level != "not_looking"
      return if both_intend_to_meet

      render json: { status: "error", error: "declarations_missing_or_not_looking" }, status: :unprocessable_entity
    end

    def reject_duplicate_welcome
      return unless MatchingWelcome.exists_between?(@sender_profile, @receiver_profile)

      render json: { status: "error", error: "already_sent" }, status: :conflict
    end
  end
end

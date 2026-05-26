module Admin
  class MeetupsController < Admin::ApplicationController
    layout "admin"

    SCOPES = %w[upcoming past unpublished all].freeze

    before_action :set_meetup, only: %i[edit update destroy]

    def index
      @scope = SCOPES.include?(params[:scope]) ? params[:scope] : "upcoming"
      @meetups = scoped_meetups
        .includes(:venue_city, :organizer_user, :organizer_organization)
        .order(start_at: :desc)
    end

    def new
      @meetup = Meetup.new(banner_gradient: "dusk", description_link_type: "external")
    end

    def create
      @meetup = Meetup.new(meetup_params.merge(created_by: current_user))
      if @meetup.save
        redirect_to admin_meetups_path, notice: I18n.t("admin.meetups.created")
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit; end

    def update
      if @meetup.update(meetup_params)
        redirect_to edit_admin_meetup_path(@meetup), notice: I18n.t("admin.meetups.updated")
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @meetup.destroy
      redirect_to admin_meetups_path, notice: I18n.t("admin.meetups.destroyed")
    end

    private

    def set_meetup
      # Meetup#to_param returns slug, so admin URLs are /admin/meetups/<slug> too.
      @meetup = Meetup.find_by!(slug: params[:id])
    end

    def scoped_meetups
      case @scope
      when "past"
        Meetup.where("end_at <= ?", Time.current)
      when "unpublished"
        Meetup.where(is_published: false)
      when "all"
        Meetup.all
      else
        Meetup.where("end_at > ?", Time.current)
      end
    end

    def meetup_params
      params.require(:meetup).permit(
        :name,
        :slug,
        :organizer_user_id,
        :organizer_organization_id,
        :venue_name,
        :venue_city_id,
        :venue_address,
        :start_at,
        :end_at,
        :banner,
        :banner_cache,
        :banner_gradient,
        :description_link_type,
        :description_internal_post_id,
        :description_external_url,
        :is_published
      )
    end
  end
end

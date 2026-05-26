module Admin
  class MatchingProfilesController < Admin::ApplicationController
    layout "admin"

    SCOPES = %w[pending approved rejected inactive all].freeze

    before_action :set_profile, only: %i[approve reject deactivate reactivate destroy]

    def index
      @scope = SCOPES.include?(params[:scope]) ? params[:scope] : "pending"
      @profiles = scoped_profiles.includes(:user, :city).order(updated_at: :desc)
    end

    def approve
      @profile.approve!
      redirect_to admin_matching_profiles_path(scope: params[:scope]), notice: I18n.t("admin.matching_profiles.approved")
    end

    def reject
      @profile.reject!(reason: params[:reason].presence)
      redirect_to admin_matching_profiles_path(scope: params[:scope]), notice: I18n.t("admin.matching_profiles.rejected")
    end

    def deactivate
      @profile.deactivate!
      redirect_to admin_matching_profiles_path(scope: params[:scope]), notice: I18n.t("admin.matching_profiles.deactivated")
    end

    def reactivate
      @profile.reactivate!
      redirect_to admin_matching_profiles_path(scope: params[:scope]), notice: I18n.t("admin.matching_profiles.reactivated")
    end

    def destroy
      @profile.destroy
      redirect_to admin_matching_profiles_path(scope: params[:scope]), notice: I18n.t("admin.matching_profiles.destroyed")
    end

    private

    def set_profile
      @profile = MatchingProfile.find(params[:id])
    end

    def scoped_profiles
      case @scope
      when "approved"
        MatchingProfile.where(moderation_state: "approved", is_active: true)
      when "rejected"
        MatchingProfile.where(moderation_state: "rejected")
      when "inactive"
        MatchingProfile.where(is_active: false)
      when "all"
        MatchingProfile.all
      else
        MatchingProfile.where(moderation_state: "pending")
      end
    end
  end
end

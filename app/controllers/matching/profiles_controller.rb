module Matching
  class ProfilesController < ApplicationController
    before_action :authenticate_user!
    before_action :block_suspended_users, only: %i[new create]
    before_action :redirect_if_profile_exists, only: %i[new create]
    before_action :set_profile, only: %i[edit update]

    def new
      @profile = MatchingProfile.new(user: current_user)
    end

    def create
      @profile = MatchingProfile.new(profile_params.merge(user: current_user))
      if @profile.save
        redirect_to matching_path, notice: I18n.t("matching.profiles.created")
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit; end

    def update
      if @profile.update(profile_params)
        redirect_to matching_path, notice: profile_updated_notice
      else
        render :edit, status: :unprocessable_entity
      end
    end

    private

    def set_profile
      @profile = MatchingProfile.find_by(user_id: current_user.id)
      raise ActiveRecord::RecordNotFound unless @profile
    end

    def redirect_if_profile_exists
      return unless MatchingProfile.exists?(user_id: current_user.id)

      redirect_to matching_path
    end

    def block_suspended_users
      return unless current_user.suspended?

      redirect_to root_path, alert: I18n.t("matching.profiles.suspended_blocked")
    end

    def profile_params
      params.require(:matching_profile).permit(:photo, :identity_type, :city_id, :bio)
    end

    def profile_updated_notice
      if @profile.pending? && @profile.saved_change_to_moderation_state?
        I18n.t("matching.profiles.updated_pending_review")
      else
        I18n.t("matching.profiles.updated")
      end
    end
  end
end

module Matching
  # GET /m/:meetup_slug/:profile_id — SPEC.md E15 event-scoped profile view.
  # Lives 48h past meetup.end_at (R-Lifecycle.2), then returns 404. Only
  # users with an approved, active profile can view (visibility is symmetric).
  class EventScopedProfilesController < ApplicationController
    EVENT_SCOPED_LIFETIME = 48.hours

    before_action :authenticate_user!

    def show
      @meetup = Meetup.find_by(slug: params[:meetup_slug])
      raise ActiveRecord::RecordNotFound unless @meetup
      raise ActiveRecord::RecordNotFound if expired?

      @profile = MatchingProfile.visible_to_others.find_by(id: params[:profile_id])
      raise ActiveRecord::RecordNotFound unless @profile

      @declaration = MeetupMatchingDeclaration.find_by(meetup: @meetup, matching_profile: @profile)
      raise ActiveRecord::RecordNotFound unless @declaration
      raise ActiveRecord::RecordNotFound if @declaration.not_looking?

      @viewer_profile = MatchingProfile.find_by(user_id: current_user.id)
      @welcome_already_sent =
        @viewer_profile.present? && MatchingWelcome.exists_between?(@viewer_profile, @profile)
      @welcome_eligible =
        @viewer_profile&.visible_to_others? &&
        current_user.id != @profile.user_id &&
        viewer_declaration_active? &&
        !@declaration.not_looking?
    end

    private

    def viewer_declaration_active?
      return false unless @viewer_profile

      dec = MeetupMatchingDeclaration.find_by(meetup_id: @meetup.id, matching_profile_id: @viewer_profile.id)
      dec.present? && !dec.not_looking?
    end

    def expired?
      @meetup.end_at <= EVENT_SCOPED_LIFETIME.ago
    end
  end
end

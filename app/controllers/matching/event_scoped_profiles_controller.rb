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
    end

    private

    def expired?
      @meetup.end_at <= EVENT_SCOPED_LIFETIME.ago
    end
  end
end

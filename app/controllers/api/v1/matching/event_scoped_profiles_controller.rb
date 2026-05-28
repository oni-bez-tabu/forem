module Api
  module V1
    module Matching
      # GET /api/m/:meetup_slug/:profile_id — event-scoped profile dla
      # native mobile (web ma SSR /m/:slug/:profile_id z embedded Preact
      # welcome modal).
      #
      # Gardy 1:1 z web ::Matching::EventScopedProfilesController:
      # - 48h lifecycle od end_at
      # - profile visible_to_others?
      # - declaration active (intent != not_looking)
      # - viewer ma RSVP na meetupie
      class EventScopedProfilesController < ApiController
        EVENT_SCOPED_LIFETIME = 48.hours

        before_action :authenticate!
        before_action :set_meetup
        before_action :require_within_lifecycle
        before_action :set_profile
        before_action :require_visible_profile
        before_action :set_declaration
        before_action :require_active_declaration
        before_action :require_viewer_rsvp

        def show
          viewer_profile = MatchingProfile.find_by(user_id: @user.id)
          welcome_eligible = welcome_eligible?(viewer_profile)
          already_sent = viewer_profile && MatchingWelcome.exists_between?(viewer_profile, @profile)
          render json: {
            profile: serialize_profile,
            declaration: serialize_declaration,
            meetup: serialize_meetup,
            welcome_eligible: welcome_eligible,
            welcome_already_sent: already_sent || false,
          }
        end

        private

        def set_meetup
          @meetup = Meetup.find_by(slug: params[:meetup_slug])
          error_not_found unless @meetup
        end

        def require_within_lifecycle
          return if @meetup.end_at + EVENT_SCOPED_LIFETIME > Time.current

          error_not_found
        end

        def set_profile
          @profile = MatchingProfile.find_by(id: params[:profile_id])
          error_not_found unless @profile
        end

        def require_visible_profile
          return if @profile.visible_to_others?

          error_not_found
        end

        def set_declaration
          @declaration = MeetupMatchingDeclaration.find_by(
            meetup_id: @meetup.id,
            matching_profile_id: @profile.id,
          )
          error_not_found unless @declaration
        end

        def require_active_declaration
          return if @declaration.intent_level != "not_looking"

          error_not_found
        end

        def require_viewer_rsvp
          return if MeetupRsvp.exists?(meetup_id: @meetup.id, user_id: @user.id)

          render json: { error: "rsvp_required", status: 403 }, status: :forbidden
        end

        def welcome_eligible?(viewer_profile)
          return false unless viewer_profile&.visible_to_others?
          return false if viewer_profile.id == @profile.id
          return false if MatchingWelcome.exists_between?(viewer_profile, @profile)

          viewer_declaration = MeetupMatchingDeclaration.find_by(
            meetup_id: @meetup.id,
            matching_profile_id: viewer_profile.id,
          )
          viewer_declaration.present? && viewer_declaration.intent_level != "not_looking"
        end

        def serialize_profile
          {
            id: @profile.id,
            photo_url: @profile.photo&.url,
            identity_type: @profile.identity_type,
            bio: @profile.bio,
            city: @profile.city && { id: @profile.city.id, name: @profile.city.name },
          }
        end

        def serialize_declaration
          {
            intent_level: @declaration.intent_level,
            meetup_note: @declaration.meetup_note,
          }
        end

        def serialize_meetup
          {
            id: @meetup.id,
            slug: @meetup.slug,
            name: @meetup.name,
            start_at: @meetup.start_at.iso8601,
            end_at: @meetup.end_at.iso8601,
            venue_name: @meetup.venue_name,
            venue_city_name: @meetup.venue_city&.name,
          }
        end
      end
    end
  end
end

module Api
  module V1
    module Meetups
      # GET /api/meetups/:slug/matches — pool list dla user'a na tym meetupie.
      # Wymaga auth + visible profile + RSVP + aktywna deklaracja
      # (nie not_looking). Te same gardy co web matching_section P3.
      class MatchesController < ApiController
        before_action :authenticate!
        before_action :set_meetup
        before_action :load_viewer_profile
        before_action :require_visible_profile
        before_action :require_rsvp
        before_action :require_active_declaration

        def index
          finder = ::Matching::PoolFinder.new(viewer_profile: @viewer_profile, meetup: @meetup)
          same = finder.same_intent_group.map { |d| serialize_match(d) }
          other = finder.other_intent_group.map { |d| serialize_match(d) }
          render json: {
            meetup_slug: @meetup.slug,
            viewer_intent_level: @viewer_declaration.intent_level,
            same_intent: same,
            other_intent: other,
          }
        end

        private

        def set_meetup
          @meetup = Meetup.visible_in_lists.find_by(slug: params[:slug])
          error_not_found unless @meetup
        end

        def load_viewer_profile
          @viewer_profile = MatchingProfile.find_by(user_id: @user.id)
        end

        def require_visible_profile
          return if @viewer_profile&.visible_to_others?

          render json: { error: "profile_required", status: 403 }, status: :forbidden
        end

        def require_rsvp
          return if MeetupRsvp.exists?(meetup_id: @meetup.id, user_id: @user.id)

          render json: { error: "rsvp_required", status: 403 }, status: :forbidden
        end

        def require_active_declaration
          @viewer_declaration = MeetupMatchingDeclaration.find_by(
            meetup_id: @meetup.id,
            matching_profile_id: @viewer_profile.id,
          )
          return if @viewer_declaration && @viewer_declaration.intent_level != "not_looking"

          render json: { error: "declaration_required", status: 403 }, status: :forbidden
        end

        def serialize_match(declaration)
          profile = declaration.matching_profile
          {
            declaration: {
              intent_level: declaration.intent_level,
              meetup_note: declaration.meetup_note,
            },
            profile: {
              id: profile.id,
              photo_url: profile.photo&.url,
              identity_type: profile.identity_type,
              bio: profile.bio,
              city_name: profile.city&.name,
            },
            event_scoped_url: "/m/#{@meetup.slug}/#{profile.id}",
          }
        end
      end
    end
  end
end

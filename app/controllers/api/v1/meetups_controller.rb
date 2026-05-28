module Api
  module V1
    # Read endpoints dla meetupów — używane przez native mobile app.
    # Web pozostaje SSR (lista + szczegóły musi się pozycjonować w Google).
    # Wszystkie endpointy publiczne (read-only); pojedyncze pole user-
    # specific (np. czy user RSVPował) wymaga auth — `current_rsvp_status`
    # gated po @user.
    class MeetupsController < ApiController
      PAGE_SIZE_DEFAULT = 20
      PAGE_SIZE_MAX = 50

      def index
        per_page = params[:per_page].to_i
        per_page = PAGE_SIZE_DEFAULT if per_page <= 0
        per_page = [per_page, PAGE_SIZE_MAX].min
        page = [params[:page].to_i, 1].max

        scope = Meetup.visible_in_lists.upcoming_first.includes(:venue_city, :organizer_user,
                                                                :organizer_organization)
        scope = scope.where(venue_city_id: params[:city_id]) if params[:city_id].present?
        scope = scope.where("end_at <= ?", params[:before].to_time) if params[:before].present?
        scope = scope.where("start_at >= ?", params[:after].to_time) if params[:after].present?

        total = scope.count
        meetups = scope.limit(per_page).offset((page - 1) * per_page).to_a
        render json: {
          meetups: meetups.map { |m| serialize_brief(m) },
          page: page,
          per_page: per_page,
          total: total,
          has_more: (page * per_page) < total,
        }
      end

      def show
        meetup = Meetup.visible_in_lists.find_by(slug: params[:slug])
        return error_not_found unless meetup

        viewer = authenticate_with_api_key_or_current_user
        render json: { meetup: serialize_full(meetup, viewer: viewer) }
      end

      private

      def serialize_brief(meetup)
        {
          id: meetup.id,
          slug: meetup.slug,
          name: meetup.name,
          start_at: meetup.start_at.iso8601,
          end_at: meetup.end_at.iso8601,
          venue_name: meetup.venue_name,
          banner_url: meetup.banner&.url,
          banner_gradient: meetup.banner_gradient,
          going_count: meetup.going_count,
          interested_count: meetup.interested_count,
          venue_city: meetup.venue_city && {
            id: meetup.venue_city.id,
            name: meetup.venue_city.name,
            slug: meetup.venue_city.slug,
            is_special: meetup.venue_city.is_special?,
          },
          organizer: organizer_brief(meetup),
        }
      end

      def serialize_full(meetup, viewer:)
        brief = serialize_brief(meetup)
        rsvp_status = nil
        if viewer
          rsvp = MeetupRsvp.find_by(meetup_id: meetup.id, user_id: viewer.id)
          rsvp_status = rsvp&.status
        end
        match_pool_count = MeetupMatchingDeclaration
          .where(meetup_id: meetup.id)
          .where(intent_level: MeetupMatchingDeclaration::ACTIVE_INTENTS)
          .joins(:matching_profile)
          .where(matching_profile: { is_active: true, moderation_state: "approved" })
          .count
        brief.merge(
          description_link_type: meetup.description_link_type,
          description_external_url: meetup.description_external_url,
          description_internal_post_slug: meetup.description_internal_post&.slug,
          current_user_rsvp_status: rsvp_status,
          match_pool_count: match_pool_count,
        )
      end

      def organizer_brief(meetup)
        if meetup.organizer_user
          {
            type: "user",
            id: meetup.organizer_user.id,
            username: meetup.organizer_user.username,
            name: meetup.organizer_user.name,
            profile_image_url: meetup.organizer_user.profile_image_url,
          }
        elsif meetup.organizer_organization
          {
            type: "organization",
            id: meetup.organizer_organization.id,
            username: meetup.organizer_organization.username,
            name: meetup.organizer_organization.name,
          }
        end
      end
    end
  end
end

module Api
  module V1
    module Matching
      # GET /api/matching/dashboard
      #
      # Combined snapshot for the matching dashboard SPA. Web Preact app
      # (Faza 3) and native mobile share this endpoint. Returns:
      #
      #   { profile: {...} | null,
      #     timeline: [{ type, at, meetup, payload }, ...] | null,
      #     recommendations: [{ meetup, active_count, ... }, ...] | null,
      #     new_matches_count: Int | null }
      #
      # `profile = null` → user has no matching profile; client should
      # send them to the onboarding flow.
      # `timeline/recommendations = null` → profile exists but is not
      # visible_to_others (pending / rejected / inactive); client shows
      # the moderation status UI instead of the timeline.
      class DashboardController < ApiController
        TIMELINE_LIMIT = 30
        RECOMMENDATIONS_LIMIT = 3

        before_action :authenticate!

        def show
          profile = MatchingProfile.find_by(user_id: @user.id)
          return render json: { profile: nil } if profile.nil?

          if profile.visible_to_others?
            timeline = ::Matching::TimelineFeed.new(user: @user, limit: TIMELINE_LIMIT).call
            recommendations = ::Matching::MeetupRecommendations
              .new(user: @user, limit: RECOMMENDATIONS_LIMIT, record_impressions: true)
              .call
            render json: {
              profile: serialize_profile(profile),
              timeline: timeline.map { |e| serialize_event(e) },
              recommendations: recommendations.map { |r| serialize_recommendation(r) },
              new_matches_count: count_new_matches(timeline),
            }
          else
            render json: {
              profile: serialize_profile(profile),
              timeline: nil,
              recommendations: nil,
              new_matches_count: nil,
            }
          end
        end

        private

        def serialize_profile(profile)
          {
            id: profile.id,
            photo_url: profile.photo&.url,
            identity_type: profile.identity_type,
            bio: profile.bio,
            moderation_state: profile.moderation_state,
            moderation_reason: profile.moderation_reason,
            is_active: profile.is_active?,
            visible_to_others: profile.visible_to_others?,
            city: profile.city && {
              id: profile.city.id,
              name: profile.city.name,
              slug: profile.city.slug,
              is_special: profile.city.is_special?,
            },
          }
        end

        def serialize_event(event)
          {
            type: event[:type].to_s,
            at: event[:at].iso8601,
            meetup: serialize_meetup_brief(event[:meetup]),
            payload: serialize_event_payload(event[:type], event[:payload]),
          }
        end

        def serialize_event_payload(type, payload)
          payload ||= {}
          case type
          when :match_found
            {
              count: payload[:count],
              joiners: (payload[:joiners] || []).map { |p| serialize_match_profile_brief(p) },
              declarations: (payload[:declarations] || []).map do |dec|
                {
                  intent_level: dec.intent_level,
                  meetup_note: dec.meetup_note,
                  matching_profile_id: dec.matching_profile_id,
                }
              end,
            }
          when :needs_intent
            { status: payload[:status] }
          when :declaration_created, :declaration_updated
            { intent: payload[:intent] }
          when :rsvp_created
            { status: payload[:status] }
          when :welcome_sent, :welcome_received
            {
              counterpart_profile_id: payload[:counterpart_profile_id],
              counterpart_identity: payload[:counterpart_identity],
            }.compact
          else
            payload
          end
        end

        def serialize_recommendation(rec)
          {
            meetup: serialize_meetup_brief(rec.meetup),
            active_count: rec.active_count,
            identity_breakdown: rec.identity_breakdown,
            open_to_meet_count: rec.open_to_meet_count,
            score: rec.score,
            reasons: rec.reasons.map(&:to_s),
          }
        end

        def serialize_meetup_brief(meetup)
          return nil unless meetup

          {
            id: meetup.id,
            slug: meetup.slug,
            name: meetup.name,
            start_at: meetup.start_at.iso8601,
            end_at: meetup.end_at.iso8601,
            venue_name: meetup.venue_name,
            banner_url: meetup.banner&.url,
            banner_gradient: meetup.banner_gradient,
          }
        end

        def serialize_match_profile_brief(profile)
          return nil unless profile

          {
            id: profile.id,
            photo_url: profile.photo&.url,
            identity_type: profile.identity_type,
            bio: profile.bio,
            city_name: profile.city&.name,
          }
        end

        def count_new_matches(timeline)
          timeline.count { |e| e[:type] == :match_found }
        end
      end
    end
  end
end

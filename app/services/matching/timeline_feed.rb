module Matching
  # Aggregates a user's matching-related activity into a single chronological
  # event stream for the E8 timeline. Per R-Lifecycle.1, entries referencing a
  # meetup older than 24h past `end_at` are filtered out.
  #
  # Event hash shape: { type:, at:, meetup:, payload: }
  # - type: :rsvp_created | :declaration_created | :declaration_updated
  #         | :welcome_sent | :welcome_received | :match_found
  # - at:   ActiveSupport::TimeWithZone (sort key)
  # - meetup: Meetup record (always present in this POC — every event is tied
  #           to a meetup)
  # - payload: type-specific hash (e.g., status for RSVP, intent for declaration,
  #            other_profile for welcome/match)
  class TimelineFeed
    DEFAULT_LIMIT = 30
    LIFECYCLE_CUTOFF = Meetup::LIST_LIFECYCLE_GRACE

    def initialize(user:, limit: DEFAULT_LIMIT)
      @user = user
      @limit = limit
      @profile = MatchingProfile.find_by(user_id: user.id)
    end

    def call
      events = rsvp_events + declaration_events + welcome_sent_events +
               welcome_received_events + match_found_events
      events
        .reject { |e| meetup_expired?(e[:meetup]) }
        .sort_by { |e| e[:at] }
        .reverse
        .first(@limit)
    end

    private

    attr_reader :user, :profile

    def meetup_expired?(meetup)
      return true if meetup.nil?

      meetup.end_at <= LIFECYCLE_CUTOFF.ago
    end

    def rsvp_events
      MeetupRsvp
        .includes(meetup: :venue_city)
        .where(user_id: user.id)
        .map do |rsvp|
          {
            type: :rsvp_created,
            at: rsvp.created_at,
            meetup: rsvp.meetup,
            payload: { status: rsvp.status },
          }
        end
    end

    def declaration_events
      return [] unless profile

      MeetupMatchingDeclaration
        .includes(meetup: :venue_city)
        .where(matching_profile_id: profile.id)
        .flat_map do |dec|
          base = { meetup: dec.meetup, payload: { intent: dec.intent_level } }
          events = [base.merge(type: :declaration_created, at: dec.created_at)]
          # Surface updates only when actually meaningful (>1s gap from create).
          if dec.updated_at - dec.created_at > 1
            events << base.merge(type: :declaration_updated, at: dec.updated_at)
          end
          events
        end
    end

    def welcome_sent_events
      return [] unless profile

      MatchingWelcome
        .includes(:meetup, receiver_profile: :user)
        .where(sender_profile_id: profile.id)
        .map do |w|
          {
            type: :welcome_sent,
            at: w.sent_at,
            meetup: w.meetup,
            payload: { other_profile_id: w.receiver_profile_id,
                       other_username: w.receiver_profile.user.username },
          }
        end
    end

    def welcome_received_events
      return [] unless profile

      MatchingWelcome
        .includes(:meetup, sender_profile: :user)
        .where(receiver_profile_id: profile.id)
        .map do |w|
          {
            type: :welcome_received,
            at: w.sent_at,
            meetup: w.meetup,
            payload: { other_profile_id: w.sender_profile_id,
                       other_username: w.sender_profile.user.username },
          }
        end
    end

    # "Match found" = someone joined a pool I'm in, *after* I declared.
    # Computed on demand from the declarations themselves — no parallel
    # event-store. For each of the viewer's active declarations, find every
    # other active declaration on the same meetup with a later `created_at`.
    def match_found_events
      return [] unless profile

      viewer_decs = MeetupMatchingDeclaration
        .where(matching_profile_id: profile.id)
        .where.not(intent_level: "not_looking")
        .pluck(:meetup_id, :created_at)
      return [] if viewer_decs.empty?

      meetup_to_viewer_decl_at = viewer_decs.to_h
      meetup_ids = meetup_to_viewer_decl_at.keys

      joiner_decs = MeetupMatchingDeclaration
        .includes(:meetup, matching_profile: :user)
        .where(meetup_id: meetup_ids)
        .where.not(intent_level: "not_looking")
        .where.not(matching_profile_id: profile.id)
        .joins(:matching_profile)
        .where(matching_profile: { is_active: true, moderation_state: "approved" })

      joiner_decs.filter_map do |jd|
        viewer_at = meetup_to_viewer_decl_at[jd.meetup_id]
        next unless viewer_at && jd.created_at > viewer_at

        {
          type: :match_found,
          at: jd.created_at,
          meetup: jd.meetup,
          payload: {
            new_profile_id: jd.matching_profile_id,
            new_username: jd.matching_profile.user.username,
          },
        }
      end
    end
  end
end

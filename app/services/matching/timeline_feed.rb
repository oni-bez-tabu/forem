module Matching
  # Aggregates a user's matching-related activity into a single chronological
  # event stream for the E8 timeline. Per R-Lifecycle.1, entries referencing a
  # meetup older than 24h past `end_at` are filtered out.
  #
  # Event hash shape: { type:, at:, meetup:, payload: }
  # - type: :rsvp_created | :declaration_created | :declaration_updated
  #         | :welcome_sent | :welcome_received | :match_found | :needs_intent
  # - at:   ActiveSupport::TimeWithZone (sort key)
  # - meetup: Meetup record (always present in this POC — every event is tied
  #           to a meetup)
  # - payload: type-specific hash; e.g.
  #   :match_found    → { count, joiners: [MatchingProfile records, top 3] }
  #     (aggregated per meetup so the timeline shows one row per meetup rather
  #     than one row per joiner — matches hifi mockup E8 "3 nowe dopasowania")
  #   :needs_intent   → {} (user has RSVP but no declaration yet)
  class TimelineFeed
    DEFAULT_LIMIT = 30
    JOINERS_PREVIEW = 3
    LIFECYCLE_CUTOFF = Meetup::LIST_LIFECYCLE_GRACE

    def initialize(user:, limit: DEFAULT_LIMIT)
      @user = user
      @limit = limit
      @profile = MatchingProfile.find_by(user_id: user.id)
    end

    def call
      events = rsvp_events + declaration_events + welcome_sent_events +
               welcome_received_events + match_found_events + needs_intent_events
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

    # Aggregated "match found" — one event per meetup, payload carries the
    # count + top-N joiner profiles. Joiners are matching declarations on
    # meetups where the viewer also has an active declaration, with a later
    # created_at than the viewer's own declaration (i.e., "joined my pool
    # after me"). The `at` of the event is the most recent joiner's time.
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
        .includes(:meetup, matching_profile: %i[user city])
        .where(meetup_id: meetup_ids)
        .where.not(intent_level: "not_looking")
        .where.not(matching_profile_id: profile.id)
        .joins(:matching_profile)
        .where(matching_profile: { is_active: true, moderation_state: "approved" })

      # Group by meetup so the timeline shows one aggregated row per meetup,
      # not one row per joiner (mockup E8 — "3 nowe dopasowania").
      grouped = joiner_decs.group_by(&:meetup_id)
      grouped.filter_map do |meetup_id, decs|
        viewer_at = meetup_to_viewer_decl_at[meetup_id]
        recent = decs.select { |d| d.created_at > viewer_at }
        next if recent.empty?

        latest = recent.max_by(&:created_at)
        sorted = recent.sort_by(&:created_at).reverse.first(JOINERS_PREVIEW)
        {
          type: :match_found,
          at: latest.created_at,
          meetup: latest.meetup,
          payload: {
            count: recent.length,
            joiners: sorted.map(&:matching_profile),
            declarations: sorted,
          },
        }
      end
    end

    # "Needs intent" — viewer has an RSVP (going/interested) on an upcoming
    # meetup but no MatchingMatching declaration yet, and they have an active
    # matching profile. Mockup E8 surfaces this as a magenta dashed prompt
    # card right in the timeline so users don't forget to declare.
    def needs_intent_events
      return [] unless profile&.visible_to_others?

      viewer_decl_meetup_ids = MeetupMatchingDeclaration
        .where(matching_profile_id: profile.id)
        .pluck(:meetup_id)
        .to_set

      MeetupRsvp
        .includes(meetup: :venue_city)
        .where(user_id: user.id)
        .filter_map do |rsvp|
          next if viewer_decl_meetup_ids.include?(rsvp.meetup_id)

          {
            type: :needs_intent,
            at: rsvp.created_at,
            meetup: rsvp.meetup,
            payload: { status: rsvp.status },
          }
        end
    end
  end
end

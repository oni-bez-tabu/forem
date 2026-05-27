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

    # "Match found" = someone new joined a pool the viewer is part of.
    # Sourced from Notification records (NewPoolMember service writes these).
    # Using Notification means we get one row per (viewer, joiner, meetup) and
    # respect the user's notification setting at the time of the event.
    def match_found_events
      Notification
        .where(user_id: user.id,
               notifiable_type: "Meetup",
               action: Notifications::Matching::NewPoolMember::Send::ACTION)
        .includes(:notifiable)
        .map do |n|
          {
            type: :match_found,
            at: n.notified_at || n.created_at,
            meetup: n.notifiable,
            payload: n.json_data.with_indifferent_access["new_profile"] || {},
          }
        end
    end
  end
end

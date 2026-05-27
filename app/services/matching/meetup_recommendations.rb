module Matching
  # POC recommendation strategy: nadchodzące meetupy w mieście usera,
  # posortowane po liczbie aktywnych deklaracji (proxy dla "tu coś się
  # dzieje"). Wyklucza meetupy gdzie user już zarezerwował RSVP.
  #
  # SPEC §12.13 woła o "pool-based" rekomendacje filtrowane przez
  # `looking_for` — kolumna została zdropowana w Etapie 3 (decyzja
  # produktowa "zestawiamy wszystkie płcie"), więc heurystyka jest
  # uproszczona do city + activity count. Jeśli kiedyś wraca filtrowanie
  # identity, wejdź tu i dodaj join + filter.
  #
  # Result shape: array of Recommendation structs
  #   - meetup: Meetup record
  #   - active_count: Integer (declarations with intent != not_looking)
  #   - identity_breakdown: Hash {String => Integer}, e.g. { "woman" => 7, "couple" => 4 }
  #   - open_to_meet_count: Integer (subset of active_count with open_to_meet)
  class MeetupRecommendations
    DEFAULT_LIMIT = 3

    Recommendation = Struct.new(:meetup, :active_count, :identity_breakdown, :open_to_meet_count, keyword_init: true)

    def initialize(user:, limit: DEFAULT_LIMIT)
      @user = user
      @limit = limit
      @profile = MatchingProfile.find_by(user_id: user.id)
    end

    def call
      return [] unless @profile&.visible_to_others?

      city = @profile.city
      base = Meetup
        .visible_in_lists
        .upcoming_first
        .where("start_at > ?", Time.current)
      base = scope_by_city(base, city)
      base = base.where.not(id: user_rsvped_meetup_ids)

      candidates = base.to_a
      return [] if candidates.empty?

      counts_by_meetup = active_counts_for(candidates.map(&:id))
      breakdowns = breakdowns_for(candidates.map(&:id))
      open_to_meet = open_to_meet_counts_for(candidates.map(&:id))

      ranked = candidates
        .sort_by { |m| [-(counts_by_meetup[m.id] || 0), m.start_at] }
        .first(@limit)

      ranked.map do |m|
        Recommendation.new(
          meetup: m,
          active_count: counts_by_meetup[m.id] || 0,
          identity_breakdown: breakdowns[m.id] || {},
          open_to_meet_count: open_to_meet[m.id] || 0,
        )
      end
    end

    private

    def scope_by_city(scope, city)
      return scope if city.is_special?

      scope
        .joins(:venue_city)
        .where("cities.id = ? OR cities.is_special = ?", city.id, true)
    end

    def user_rsvped_meetup_ids
      MeetupRsvp.where(user_id: @user.id).pluck(:meetup_id)
    end

    def active_counts_for(meetup_ids)
      MeetupMatchingDeclaration
        .where(meetup_id: meetup_ids)
        .where(intent_level: MeetupMatchingDeclaration::ACTIVE_INTENTS)
        .group(:meetup_id)
        .count
    end

    def open_to_meet_counts_for(meetup_ids)
      MeetupMatchingDeclaration
        .where(meetup_id: meetup_ids, intent_level: "open_to_meet")
        .group(:meetup_id)
        .count
    end

    def breakdowns_for(meetup_ids)
      rows = MeetupMatchingDeclaration
        .joins(:matching_profile)
        .where(meetup_id: meetup_ids)
        .where(intent_level: MeetupMatchingDeclaration::ACTIVE_INTENTS)
        .group(:meetup_id, "matching_profiles.identity_type")
        .count

      rows.each_with_object(Hash.new { |h, k| h[k] = {} }) do |((mid, identity), cnt), acc|
        acc[mid][identity] = cnt
      end
    end
  end
end

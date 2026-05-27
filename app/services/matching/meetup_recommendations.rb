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
  class MeetupRecommendations
    DEFAULT_LIMIT = 3

    def initialize(user:, limit: DEFAULT_LIMIT)
      @user = user
      @limit = limit
      @profile = MatchingProfile.find_by(user_id: user.id)
    end

    def call
      return Meetup.none unless @profile&.visible_to_others?

      city = @profile.city
      base = Meetup
        .visible_in_lists
        .upcoming_first
        .where("start_at > ?", Time.current)
      base = scope_by_city(base, city)
      base = base.where.not(id: user_rsvped_meetup_ids)

      # Subquery counts only active-intent declarations per meetup. Plain
      # left_join + GROUP BY hit an ambiguous-`id` interpretation in PG that
      # silently dropped meetups without declarations.
      active_counts = MeetupMatchingDeclaration
        .where(intent_level: MeetupMatchingDeclaration::ACTIVE_INTENTS)
        .group(:meetup_id)
        .count

      candidates = base.to_a
      candidates
        .sort_by { |m| [-(active_counts[m.id] || 0), m.start_at] }
        .first(@limit)
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
  end
end

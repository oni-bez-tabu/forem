module Matching
  # POC recommendation strategy: nadchodzące meetupy w mieście usera,
  # zważone po (1) liczbie aktywnych deklaracji jako proxy "tu coś się
  # dzieje" oraz (2) "repeat-organizer" — bonus za organizatora u którego
  # user już RSVP'ował w przeszłości. Wyklucza meetupy gdzie user już ma
  # RSVP oraz te, które w ostatnich 7 dniach pokazaliśmy mu już 2+ razy
  # (frequency cap).
  #
  # SPEC §12.13 woła o "pool-based" rekomendacje filtrowane przez
  # `looking_for` — kolumna została zdropowana w Etapie 3 (decyzja
  # produktowa "zestawiamy wszystkie płcie"), więc heurystyka identity-aware
  # ("similar vibe") została pominięta. Wraca dopiero gdy `looking_for`
  # wraca.
  #
  # Result shape: array of Recommendation structs
  #   - meetup: Meetup record
  #   - active_count: Integer (declarations with intent != not_looking)
  #   - identity_breakdown: Hash {String => Integer}, e.g. { "woman" => 7, "couple" => 4 }
  #   - open_to_meet_count: Integer (subset of active_count with open_to_meet)
  #   - score: Integer (active_count + organizer bonus)
  #   - reasons: Array<Symbol> (np. [:repeat_organizer])
  class MeetupRecommendations
    DEFAULT_LIMIT = 3
    REPEAT_ORGANIZER_BONUS = 5

    Recommendation = Struct.new(
      :meetup,
      :active_count,
      :identity_breakdown,
      :open_to_meet_count,
      :score,
      :reasons,
      keyword_init: true,
    )

    def initialize(user:, limit: DEFAULT_LIMIT, record_impressions: false)
      @user = user
      @limit = limit
      @record_impressions = record_impressions
      @profile = MatchingProfile.find_by(user_id: user.id)
    end

    def call
      return [] unless @profile&.visible_to_others?

      candidates = candidate_meetups
      return [] if candidates.empty?

      recommendations = rank_candidates(candidates)
      record_impressions!(recommendations.map { |r| r.meetup.id }) if @record_impressions
      recommendations
    end

    private

    def candidate_meetups
      base = Meetup
        .visible_in_lists
        .upcoming_first
        .where("start_at > ?", Time.current)
      base = scope_by_city(base, @profile.city)
      base = base.where.not(id: user_rsvped_meetup_ids)
      base.where.not(id: frequency_capped_meetup_ids).to_a
    end

    def rank_candidates(candidates)
      ids = candidates.map(&:id)
      counts_by_meetup = active_counts_for(ids)
      breakdowns = breakdowns_for(ids)
      open_to_meet = open_to_meet_counts_for(ids)
      organizer_bonus = organizer_bonus_for(candidates)

      scored = candidates.map do |m|
        active = counts_by_meetup[m.id] || 0
        bonus = organizer_bonus[m.id] || 0
        { meetup: m, score: active + bonus, active: active, bonus: bonus }
      end
      ranked = scored.sort_by { |row| [-row[:score], row[:meetup].start_at] }.first(@limit)

      ranked.map do |row|
        m = row[:meetup]
        Recommendation.new(
          meetup: m,
          active_count: row[:active],
          identity_breakdown: breakdowns[m.id] || {},
          open_to_meet_count: open_to_meet[m.id] || 0,
          score: row[:score],
          reasons: row[:bonus].positive? ? [:repeat_organizer] : [],
        )
      end
    end

    def scope_by_city(scope, city)
      return scope if city.is_special?

      scope
        .joins(:venue_city)
        .where("cities.id = ? OR cities.is_special = ?", city.id, true)
    end

    def user_rsvped_meetup_ids
      MeetupRsvp.where(user_id: @user.id).pluck(:meetup_id)
    end

    # Meetups already surfaced as recommendations to this user `WEEKLY_CAP`
    # times within `RECENCY_WINDOW`. Once a meetup hits the cap, hide it from
    # future runs until impressions roll out of the window.
    def frequency_capped_meetup_ids
      MatchingRecommendationImpression
        .recent_for(@user)
        .group(:meetup_id)
        .having("COUNT(*) >= ?", MatchingRecommendationImpression::WEEKLY_CAP)
        .pluck(:meetup_id)
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

    # Returns Hash{meetup_id => bonus_score}. A candidate gets `REPEAT_ORGANIZER_BONUS`
    # if its organizer (user OR org) appears among the user's past RSVPs
    # (regardless of going/interested — both count as "engaged with this org").
    def organizer_bonus_for(candidates)
      past_user_ids, past_org_ids = past_organizer_ids
      return Hash.new(0) if past_user_ids.empty? && past_org_ids.empty?

      candidates.each_with_object({}) do |m, acc|
        match = (m.organizer_user_id.present? && past_user_ids.include?(m.organizer_user_id)) ||
          (m.organizer_organization_id.present? && past_org_ids.include?(m.organizer_organization_id))
        acc[m.id] = REPEAT_ORGANIZER_BONUS if match
      end
    end

    def past_organizer_ids
      rows = MeetupRsvp
        .joins(:meetup)
        .where(user_id: @user.id)
        .pluck("meetups.organizer_user_id", "meetups.organizer_organization_id")

      users = rows.filter_map(&:first).uniq
      orgs  = rows.filter_map(&:last).uniq
      [users, orgs]
    end

    def record_impressions!(meetup_ids)
      return if meetup_ids.empty?

      # Dedupe per day per (user, meetup) — kolejne odświeżenia dashboardu w
      # ciągu dnia nie kapują meetupu (cap = 2 dni w 7-dniowym oknie, nie
      # 2 page-loady). Bez tego user widzący /matching 2 razy traci wszystkie
      # rekomendacje na tydzień.
      today_start = Time.current.beginning_of_day
      already_today = MatchingRecommendationImpression
        .where(user_id: @user.id, meetup_id: meetup_ids)
        .where("shown_at >= ?", today_start)
        .pluck(:meetup_id)
        .to_set
      new_ids = meetup_ids - already_today.to_a
      return if new_ids.empty?

      now = Time.current
      rows = new_ids.map do |mid|
        { user_id: @user.id, meetup_id: mid, shown_at: now, created_at: now, updated_at: now }
      end
      MatchingRecommendationImpression.insert_all(rows)
    end
  end
end

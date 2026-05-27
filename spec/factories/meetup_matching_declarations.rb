FactoryBot.define do
  factory :meetup_matching_declaration do
    association :meetup
    association :matching_profile
    intent_level { "open_to_meet" }
    looking_for { %w[woman man non_binary couple] }

    # SPEC.md §4.4 — a declaration requires the user to have an RSVP on the
    # same meetup. Auto-create one when the factory is used.
    before(:create) do |dec|
      next if dec.meetup.nil? || dec.matching_profile.nil?
      next if MeetupRsvp.exists?(meetup_id: dec.meetup.id, user_id: dec.matching_profile.user_id)

      create(:meetup_rsvp, meetup: dec.meetup, user: dec.matching_profile.user, status: "going")
    end

    trait :just_vibe do
      intent_level { "just_vibe" }
    end

    trait :not_looking do
      intent_level { "not_looking" }
      looking_for { [] }
    end
  end
end

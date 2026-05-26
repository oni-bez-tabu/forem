FactoryBot.define do
  sequence(:meetup_name) { |n| "Meetup #{n}" }

  factory :meetup do
    name { generate(:meetup_name) }
    venue_name { "Klub Hybrydy" }
    association :venue_city, factory: :city
    start_at { 1.week.from_now.change(usec: 0) }
    end_at { (start_at + 3.hours).change(usec: 0) }
    banner_gradient { "dusk" }
    description_link_type { "external" }
    description_external_url { "https://example.com/event" }
    is_published { true }
    association :created_by, factory: :user
    association :organizer_user, factory: :user

    trait :unpublished do
      is_published { false }
    end

    trait :recently_ended do
      start_at { 6.hours.ago.change(usec: 0) }
      end_at { 1.hour.ago.change(usec: 0) }
    end

    trait :expired_for_lists do
      start_at { 3.days.ago.change(usec: 0) }
      end_at { 2.days.ago.change(usec: 0) }
    end

    trait :organized_by_organization do
      organizer_user { nil }
      association :organizer_organization, factory: :organization
    end

    trait :with_internal_description do
      description_link_type { "internal" }
      description_external_url { nil }
      association :description_internal_post, factory: :article
    end
  end
end

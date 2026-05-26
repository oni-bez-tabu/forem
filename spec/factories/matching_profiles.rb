FactoryBot.define do
  factory :matching_profile do
    association :user
    association :city
    identity_type { "woman" }
    bio { "Hello, I'm a sample bio." }
    is_active { true }
    moderation_state { "pending" }

    # Carrierwave needs a real file for `photo` presence validation to pass.
    after(:build) do |profile|
      profile.photo = File.open(Rails.root.join("spec/fixtures/files/800x600.png"))
    end

    trait :approved do
      moderation_state { "approved" }
    end

    trait :rejected do
      moderation_state { "rejected" }
      moderation_reason { "Sample rejection reason" }
    end

    trait :inactive do
      is_active { false }
    end
  end
end

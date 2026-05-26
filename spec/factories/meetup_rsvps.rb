FactoryBot.define do
  factory :meetup_rsvp do
    association :meetup
    association :user
    status { "going" }

    trait :interested do
      status { "interested" }
    end
  end
end

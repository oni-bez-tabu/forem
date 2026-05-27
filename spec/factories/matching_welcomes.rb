FactoryBot.define do
  factory :matching_welcome do
    sender_profile factory: %i[matching_profile approved]
    receiver_profile factory: %i[matching_profile approved]
    meetup
    sent_at { Time.current }
  end
end

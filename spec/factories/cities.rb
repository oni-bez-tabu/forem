FactoryBot.define do
  sequence(:city_name) { |n| "TestCity#{n}" }

  factory :city do
    name { generate(:city_name) }
    population_hint { 10_000 }
    is_special { false }
  end
end

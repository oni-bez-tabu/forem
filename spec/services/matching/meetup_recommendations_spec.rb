require "rails_helper"

RSpec.describe Matching::MeetupRecommendations do
  let(:user) { create(:user) }
  let(:warsaw) { create(:city, name: "Warszawa", slug: "warszawa-#{SecureRandom.hex(3)}") }
  let(:krakow) { create(:city, name: "Kraków", slug: "krakow-#{SecureRandom.hex(3)}") }
  let(:everywhere) { create(:city, name: "🌍 Wszędzie", slug: "ev-#{SecureRandom.hex(3)}", is_special: true) }

  context "without an approved+active matching profile" do
    it "returns no recommendations" do
      expect(described_class.new(user: user).call).to be_empty
    end
  end

  context "with an approved+active profile in Warszawa" do
    let!(:profile) { create(:matching_profile, :approved, user: user, city: warsaw) }

    it "returns upcoming meetups in the user's city" do
      m = create(:meetup, venue_city: warsaw, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      expect(described_class.new(user: user).call.to_a).to include(m)
    end

    it "includes 'everywhere' meetups regardless of user's city" do
      m = create(:meetup, venue_city: everywhere, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      expect(described_class.new(user: user).call.to_a).to include(m)
    end

    it "excludes meetups in other cities" do
      m = create(:meetup, venue_city: krakow, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      expect(described_class.new(user: user).call.to_a).not_to include(m)
    end

    it "excludes meetups the user already RSVP'd to" do
      m = create(:meetup, venue_city: warsaw, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      create(:meetup_rsvp, meetup: m, user: user, status: "going")
      expect(described_class.new(user: user).call.to_a).not_to include(m)
    end

    it "excludes already-started meetups" do
      m = create(:meetup, :recently_ended, venue_city: warsaw)
      expect(described_class.new(user: user).call.to_a).not_to include(m)
    end

    it "excludes unpublished meetups" do
      m = create(:meetup, :unpublished, venue_city: warsaw, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      expect(described_class.new(user: user).call.to_a).not_to include(m)
    end

    it "orders by active-declaration count DESC, then by start_at ASC" do
      quiet = create(:meetup, venue_city: warsaw, start_at: 1.day.from_now, end_at: 1.day.from_now + 2.hours)
      busy = create(:meetup, venue_city: warsaw, start_at: 5.days.from_now, end_at: 5.days.from_now + 2.hours)
      3.times do
        p = create(:matching_profile, :approved)
        create(:meetup_rsvp, meetup: busy, user: p.user, status: "going")
        create(:meetup_matching_declaration, meetup: busy, matching_profile: p, intent_level: "open_to_meet")
      end

      results = described_class.new(user: user).call.to_a
      expect(results.first).to eq(busy)
      expect(results.second).to eq(quiet)
    end

    it "respects the limit" do
      5.times { create(:meetup, venue_city: warsaw, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours) }
      expect(described_class.new(user: user, limit: 2).call.size).to eq(2)
    end
  end

  context "with an approved+active profile in 'everywhere'" do
    let!(:profile) { create(:matching_profile, :approved, user: user, city: everywhere) }

    it "returns meetups from any city" do
      m_w = create(:meetup, venue_city: warsaw, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      m_k = create(:meetup, venue_city: krakow, start_at: 3.days.from_now, end_at: 3.days.from_now + 2.hours)
      results = described_class.new(user: user).call.to_a
      expect(results).to include(m_w, m_k)
    end
  end
end

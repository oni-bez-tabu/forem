require "rails_helper"

RSpec.describe Matching::MeetupRecommendations do
  let(:user) { create(:user) }
  let(:warsaw) { create(:city, name: "Warszawa", slug: "warszawa-#{SecureRandom.hex(3)}") }
  let(:krakow) { create(:city, name: "Kraków", slug: "krakow-#{SecureRandom.hex(3)}") }
  let(:everywhere) { create(:city, name: "🌍 Wszędzie", slug: "ev-#{SecureRandom.hex(3)}", is_special: true) }

  def meetup_ids(recs)
    recs.map { |r| r.meetup.id }
  end

  context "without an approved+active matching profile" do
    it "returns no recommendations" do
      expect(described_class.new(user: user).call).to be_empty
    end
  end

  context "with an approved+active profile in Warszawa" do
    let!(:profile) { create(:matching_profile, :approved, user: user, city: warsaw) }

    it "returns upcoming meetups in the user's city" do
      m = create(:meetup, venue_city: warsaw, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      expect(meetup_ids(described_class.new(user: user).call)).to include(m.id)
    end

    it "includes 'everywhere' meetups regardless of user's city" do
      m = create(:meetup, venue_city: everywhere, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      expect(meetup_ids(described_class.new(user: user).call)).to include(m.id)
    end

    it "excludes meetups in other cities" do
      m = create(:meetup, venue_city: krakow, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      expect(meetup_ids(described_class.new(user: user).call)).not_to include(m.id)
    end

    it "excludes meetups the user already RSVP'd to" do
      m = create(:meetup, venue_city: warsaw, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      create(:meetup_rsvp, meetup: m, user: user, status: "going")
      expect(meetup_ids(described_class.new(user: user).call)).not_to include(m.id)
    end

    it "excludes already-started meetups" do
      m = create(:meetup, :recently_ended, venue_city: warsaw)
      expect(meetup_ids(described_class.new(user: user).call)).not_to include(m.id)
    end

    it "excludes unpublished meetups" do
      m = create(:meetup, :unpublished, venue_city: warsaw, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      expect(meetup_ids(described_class.new(user: user).call)).not_to include(m.id)
    end

    it "orders by active-declaration count DESC, then by start_at ASC" do
      quiet = create(:meetup, venue_city: warsaw, start_at: 1.day.from_now, end_at: 1.day.from_now + 2.hours)
      busy = create(:meetup, venue_city: warsaw, start_at: 5.days.from_now, end_at: 5.days.from_now + 2.hours)
      3.times do
        p = create(:matching_profile, :approved)
        create(:meetup_rsvp, meetup: busy, user: p.user, status: "going")
        create(:meetup_matching_declaration, meetup: busy, matching_profile: p, intent_level: "open_to_meet")
      end

      results = described_class.new(user: user).call
      expect(results.first.meetup).to eq(busy)
      expect(results.second.meetup).to eq(quiet)
    end

    it "respects the limit" do
      5.times { create(:meetup, venue_city: warsaw, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours) }
      expect(described_class.new(user: user, limit: 2).call.size).to eq(2)
    end

    it "exposes active_count + identity_breakdown + open_to_meet_count" do
      m = create(:meetup, venue_city: warsaw, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      w1 = create(:matching_profile, :approved, identity_type: "woman")
      w2 = create(:matching_profile, :approved, identity_type: "woman")
      couple = create(:matching_profile, :approved, identity_type: "couple")
      not_looking_p = create(:matching_profile, :approved, identity_type: "man")

      [w1, w2, couple, not_looking_p].each do |p|
        create(:meetup_rsvp, meetup: m, user: p.user, status: "going")
      end
      create(:meetup_matching_declaration, meetup: m, matching_profile: w1, intent_level: "open_to_meet")
      create(:meetup_matching_declaration, meetup: m, matching_profile: w2, intent_level: "just_vibe")
      create(:meetup_matching_declaration, meetup: m, matching_profile: couple, intent_level: "open_to_meet")
      create(:meetup_matching_declaration, meetup: m, matching_profile: not_looking_p, intent_level: "not_looking")

      rec = described_class.new(user: user).call.find { |r| r.meetup.id == m.id }
      expect(rec.active_count).to eq(3)
      expect(rec.identity_breakdown).to eq("woman" => 2, "couple" => 1)
      expect(rec.open_to_meet_count).to eq(2)
    end
  end

  context "with an approved+active profile in 'everywhere'" do
    let!(:profile) { create(:matching_profile, :approved, user: user, city: everywhere) }

    it "returns meetups from any city" do
      m_w = create(:meetup, venue_city: warsaw, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      m_k = create(:meetup, venue_city: krakow, start_at: 3.days.from_now, end_at: 3.days.from_now + 2.hours)
      results = described_class.new(user: user).call
      ids = results.map { |r| r.meetup.id }
      expect(ids).to include(m_w.id, m_k.id)
    end
  end
end

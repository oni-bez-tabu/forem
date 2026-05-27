require "rails_helper"

RSpec.describe Matching::TimelineFeed do
  let(:user) { create(:user) }
  let(:profile) { create(:matching_profile, :approved, user: user) }

  describe "#call" do
    it "returns rsvp_created events" do
      meetup = create(:meetup)
      rsvp = create(:meetup_rsvp, meetup: meetup, user: user, status: "going")
      events = described_class.new(user: user).call
      rsvp_event = events.find { |e| e[:type] == :rsvp_created }
      expect(rsvp_event).to include(meetup: meetup, payload: { status: "going" })
      expect(rsvp_event[:at]).to be_within(1.second).of(rsvp.created_at)
    end

    it "returns declaration_created events for the viewer's profile" do
      profile
      meetup = create(:meetup)
      create(:meetup_rsvp, meetup: meetup, user: user, status: "going")
      dec = create(:meetup_matching_declaration, meetup: meetup, matching_profile: profile, intent_level: "open_to_meet")

      events = described_class.new(user: user).call
      dec_event = events.find { |e| e[:type] == :declaration_created }
      expect(dec_event).to include(meetup: meetup, payload: { intent: "open_to_meet" })
      expect(dec_event[:at]).to be_within(1.second).of(dec.created_at)
    end

    it "emits declaration_updated only when updated_at differs meaningfully from created_at" do
      profile
      meetup = create(:meetup)
      create(:meetup_rsvp, meetup: meetup, user: user, status: "going")
      dec = create(:meetup_matching_declaration, meetup: meetup, matching_profile: profile, intent_level: "open_to_meet")
      dec.update_columns(created_at: 2.days.ago, updated_at: 1.day.ago)

      events = described_class.new(user: user).call
      types = events.map { |e| e[:type] }
      expect(types).to include(:declaration_created, :declaration_updated)
    end

    it "returns welcome_sent events" do
      profile
      receiver = create(:matching_profile, :approved)
      meetup = create(:meetup)
      w = create(:matching_welcome, sender_profile: profile, receiver_profile: receiver, meetup: meetup)
      events = described_class.new(user: user).call
      ws = events.find { |e| e[:type] == :welcome_sent }
      expect(ws[:meetup]).to eq(meetup)
      expect(ws[:payload][:other_profile_id]).to eq(receiver.id)
      expect(ws[:at]).to be_within(1.second).of(w.sent_at)
    end

    it "returns welcome_received events" do
      profile
      sender = create(:matching_profile, :approved)
      meetup = create(:meetup)
      create(:matching_welcome, sender_profile: sender, receiver_profile: profile, meetup: meetup)
      events = described_class.new(user: user).call
      wr = events.find { |e| e[:type] == :welcome_received }
      expect(wr[:meetup]).to eq(meetup)
      expect(wr[:payload][:other_profile_id]).to eq(sender.id)
    end

    it "derives match_found from declarations created after the viewer's own" do
      profile
      meetup = create(:meetup)
      create(:meetup_rsvp, meetup: meetup, user: user, status: "going")
      viewer_dec = create(:meetup_matching_declaration,
                          meetup: meetup,
                          matching_profile: profile,
                          intent_level: "open_to_meet")
      viewer_dec.update_columns(created_at: 2.days.ago)

      joiner = create(:matching_profile, :approved)
      create(:meetup_rsvp, meetup: meetup, user: joiner.user, status: "going")
      joiner_dec = create(:meetup_matching_declaration,
                          meetup: meetup,
                          matching_profile: joiner,
                          intent_level: "open_to_meet")
      joiner_dec.update_columns(created_at: 1.hour.ago)

      events = described_class.new(user: user).call
      mf = events.find { |e| e[:type] == :match_found }
      expect(mf).to be_present
      expect(mf[:meetup]).to eq(meetup)
      expect(mf[:payload][:new_profile_id]).to eq(joiner.id)
      expect(mf[:payload][:new_username]).to eq(joiner.user.username)
    end

    it "skips match_found rows for declarations older than the viewer's" do
      profile
      meetup = create(:meetup)
      create(:meetup_rsvp, meetup: meetup, user: user, status: "going")
      viewer_dec = create(:meetup_matching_declaration,
                          meetup: meetup,
                          matching_profile: profile,
                          intent_level: "open_to_meet")
      viewer_dec.update_columns(created_at: 1.hour.ago)

      older = create(:matching_profile, :approved)
      create(:meetup_rsvp, meetup: meetup, user: older.user, status: "going")
      older_dec = create(:meetup_matching_declaration,
                         meetup: meetup,
                         matching_profile: older,
                         intent_level: "open_to_meet")
      older_dec.update_columns(created_at: 2.days.ago)

      events = described_class.new(user: user).call
      expect(events.map { |e| e[:type] }).not_to include(:match_found)
    end

    it "skips match_found from not_looking joiners" do
      profile
      meetup = create(:meetup)
      create(:meetup_rsvp, meetup: meetup, user: user, status: "going")
      viewer_dec = create(:meetup_matching_declaration,
                          meetup: meetup,
                          matching_profile: profile,
                          intent_level: "open_to_meet")
      viewer_dec.update_columns(created_at: 2.days.ago)

      nl = create(:matching_profile, :approved)
      create(:meetup_rsvp, meetup: meetup, user: nl.user, status: "going")
      nl_dec = create(:meetup_matching_declaration,
                      meetup: meetup,
                      matching_profile: nl,
                      intent_level: "not_looking")
      nl_dec.update_columns(created_at: 1.hour.ago)

      events = described_class.new(user: user).call
      expect(events.map { |e| e[:type] }).not_to include(:match_found)
    end

    it "filters out events for meetups older than 24h past end_at (R-Lifecycle.1)" do
      old = create(:meetup, :expired_for_lists)
      create(:meetup_rsvp, meetup: old, user: user, status: "going")
      fresh = create(:meetup)
      create(:meetup_rsvp, meetup: fresh, user: user, status: "going")

      events = described_class.new(user: user).call
      meetup_ids = events.map { |e| e[:meetup].id }
      expect(meetup_ids).to include(fresh.id)
      expect(meetup_ids).not_to include(old.id)
    end

    it "sorts events chronologically descending and respects the limit" do
      m1 = create(:meetup)
      m2 = create(:meetup)
      m3 = create(:meetup)
      r1 = create(:meetup_rsvp, meetup: m1, user: user, status: "going")
      r2 = create(:meetup_rsvp, meetup: m2, user: user, status: "going")
      r3 = create(:meetup_rsvp, meetup: m3, user: user, status: "going")
      r1.update_columns(created_at: 3.hours.ago)
      r2.update_columns(created_at: 1.hour.ago)
      r3.update_columns(created_at: 2.hours.ago)

      events = described_class.new(user: user, limit: 2).call
      expect(events.length).to eq(2)
      expect(events.first[:meetup]).to eq(m2)
      expect(events.second[:meetup]).to eq(m3)
    end

    it "handles a user with no matching_profile (only RSVP events visible)" do
      meetup = create(:meetup)
      create(:meetup_rsvp, meetup: meetup, user: user, status: "interested")
      events = described_class.new(user: user).call
      expect(events.map { |e| e[:type] }).to eq([:rsvp_created])
    end
  end
end

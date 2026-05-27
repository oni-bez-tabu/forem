require "rails_helper"

RSpec.describe MeetupMatchingDeclaration do
  let(:meetup) { create(:meetup) }
  let(:profile) { create(:matching_profile, :approved) }
  let!(:rsvp) { create(:meetup_rsvp, meetup: meetup, user: profile.user, status: "going") }

  describe "validations" do
    it "is valid with default factory" do
      expect(build(:meetup_matching_declaration, meetup: meetup, matching_profile: profile)).to be_valid
    end

    it "rejects unknown intent_level" do
      d = build(:meetup_matching_declaration, intent_level: "looking_hard")
      expect(d).not_to be_valid
    end

    it "limits meetup_note length" do
      d = build(:meetup_matching_declaration, meetup: meetup, matching_profile: profile, meetup_note: "x" * 201)
      expect(d).not_to be_valid
    end

    it "enforces uniqueness per (meetup, matching_profile)" do
      create(:meetup_matching_declaration, meetup: meetup, matching_profile: profile)
      dup = build(:meetup_matching_declaration, meetup: meetup, matching_profile: profile, intent_level: "just_vibe")
      expect(dup).not_to be_valid
    end

    it "rejects looking_for entries not in identity types" do
      d = build(:meetup_matching_declaration, looking_for: %w[woman alien])
      expect(d).not_to be_valid
      expect(d.errors[:looking_for]).to be_present
    end

    it "requires an RSVP on the same meetup" do
      other_meetup = create(:meetup)
      other_profile = create(:matching_profile, :approved)
      d = build(:meetup_matching_declaration, meetup: other_meetup, matching_profile: other_profile)
      expect(d).not_to be_valid
      expect(d.errors[:base].first).to include("RSVP")
    end
  end

  describe "#effective_looking_for" do
    it "returns the raw list for open_to_meet" do
      d = build(:meetup_matching_declaration, intent_level: "open_to_meet", looking_for: %w[woman])
      expect(d.effective_looking_for).to eq(%w[woman])
    end

    it "expands empty just_vibe to all identity types (R3)" do
      d = build(:meetup_matching_declaration, intent_level: "just_vibe", looking_for: [])
      expect(d.effective_looking_for).to match_array(MatchingProfile::IDENTITY_TYPES)
    end

    it "honors explicit just_vibe filters" do
      d = build(:meetup_matching_declaration, intent_level: "just_vibe", looking_for: %w[woman])
      expect(d.effective_looking_for).to eq(%w[woman])
    end
  end

  describe "#not_looking?" do
    it "is true only for not_looking intent" do
      expect(build(:meetup_matching_declaration, :not_looking).not_looking?).to be(true)
      expect(build(:meetup_matching_declaration).not_looking?).to be(false)
    end
  end
end

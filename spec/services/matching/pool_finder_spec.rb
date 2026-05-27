require "rails_helper"

RSpec.describe Matching::PoolFinder do
  let(:meetup) { create(:meetup) }

  # Helper: build a participant (approved profile + RSVP + declaration) for a meetup.
  def declared_user(identity:, intent:, on: meetup, **_unused)
    profile = create(:matching_profile, :approved, identity_type: identity)
    create(:meetup_rsvp, meetup: on, user: profile.user, status: "going")
    create(:meetup_matching_declaration, meetup: on, matching_profile: profile, intent_level: intent)
    profile
  end

  describe "viewer_visible?" do
    it "is false when the viewer has no declaration" do
      viewer = create(:matching_profile, :approved)
      finder = described_class.new(viewer_profile: viewer, meetup: meetup)
      expect(finder.viewer_visible?).to be(false)
    end

    it "is false when the viewer declared not_looking (R4)" do
      viewer = declared_user(identity: "woman", intent: "not_looking", looking_for: [])
      finder = described_class.new(viewer_profile: viewer, meetup: meetup)
      expect(finder.viewer_visible?).to be(false)
    end

    it "is true when the viewer has an active declaration" do
      viewer = declared_user(identity: "woman", intent: "open_to_meet")
      finder = described_class.new(viewer_profile: viewer, meetup: meetup)
      expect(finder.viewer_visible?).to be(true)
    end
  end

  describe "compatible_declarations" do
    it "ignores identity filters — all active declarations are compatible (session #2 decision)" do
      viewer = declared_user(identity: "woman", intent: "open_to_meet")
      match_man = declared_user(identity: "man", intent: "open_to_meet")
      match_couple = declared_user(identity: "couple", intent: "open_to_meet")

      finder = described_class.new(viewer_profile: viewer, meetup: meetup)
      profiles = finder.compatible_declarations.map(&:matching_profile)
      expect(profiles).to contain_exactly(match_man, match_couple)
    end

    it "excludes not_looking peers (R4)" do
      viewer = declared_user(identity: "woman", intent: "open_to_meet")
      _inactive = declared_user(identity: "man", intent: "not_looking", looking_for: [])
      finder = described_class.new(viewer_profile: viewer, meetup: meetup)
      expect(finder.compatible_declarations).to be_empty
    end

    it "includes just_vibe peers regardless of looking_for value" do
      viewer = declared_user(identity: "woman", intent: "open_to_meet")
      vibe_match = declared_user(identity: "man", intent: "just_vibe", looking_for: [])

      finder = described_class.new(viewer_profile: viewer, meetup: meetup)
      expect(finder.compatible_declarations.map(&:matching_profile)).to include(vibe_match)
    end

    it "excludes profiles that are pending moderation" do
      viewer = declared_user(identity: "woman", intent: "open_to_meet")
      pending_profile = create(:matching_profile, identity_type: "man")
      create(:meetup_rsvp, meetup: meetup, user: pending_profile.user, status: "going")
      create(:meetup_matching_declaration, meetup: meetup, matching_profile: pending_profile, intent_level: "open_to_meet")

      finder = described_class.new(viewer_profile: viewer, meetup: meetup)
      expect(finder.compatible_declarations).to be_empty
    end

    it "excludes inactive profiles" do
      viewer = declared_user(identity: "woman", intent: "open_to_meet")
      inactive_profile = create(:matching_profile, :approved, :inactive, identity_type: "man")
      create(:meetup_rsvp, meetup: meetup, user: inactive_profile.user, status: "going")
      create(:meetup_matching_declaration, meetup: meetup, matching_profile: inactive_profile, intent_level: "open_to_meet")

      finder = described_class.new(viewer_profile: viewer, meetup: meetup)
      expect(finder.compatible_declarations).to be_empty
    end
  end

  describe "grouping (R2 / R5)" do
    it "splits into same-intent and other-intent groups" do
      viewer = declared_user(identity: "woman", intent: "open_to_meet")
      same = declared_user(identity: "man", intent: "open_to_meet")
      other = declared_user(identity: "non_binary", intent: "just_vibe")

      finder = described_class.new(viewer_profile: viewer, meetup: meetup)
      expect(finder.same_intent_group.map(&:matching_profile)).to contain_exactly(same)
      expect(finder.other_intent_group.map(&:matching_profile)).to contain_exactly(other)
    end
  end
end

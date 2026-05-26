require "rails_helper"

RSpec.describe MatchingProfile do
  describe "validations" do
    it "is valid with default factory" do
      expect(build(:matching_profile)).to be_valid
    end

    it "requires photo" do
      profile = build(:matching_profile)
      profile.photo = nil
      expect(profile).not_to be_valid
      expect(profile.errors[:photo]).to be_present
    end

    it "rejects unknown identity_type" do
      profile = build(:matching_profile, identity_type: "robot")
      expect(profile).not_to be_valid
    end

    it "limits bio length" do
      profile = build(:matching_profile, bio: "x" * 201)
      expect(profile).not_to be_valid
    end

    it "enforces user uniqueness" do
      user = create(:user)
      create(:matching_profile, user: user)
      duplicate = build(:matching_profile, user: user)
      expect(duplicate).not_to be_valid
    end
  end

  describe "moderation state" do
    let(:profile) { create(:matching_profile, :approved) }

    it "resets to pending when content fields change" do
      expect { profile.update!(bio: "new bio") }
        .to change { profile.reload.moderation_state }.from("approved").to("pending")
    end

    it "does not reset when only is_active changes" do
      expect { profile.update!(is_active: false) }
        .not_to change { profile.reload.moderation_state }
    end

    it "approve! sets state to approved and clears reason" do
      rejected = create(:matching_profile, :rejected)
      rejected.approve!
      expect(rejected.reload).to be_approved
      expect(rejected.moderation_reason).to be_nil
    end

    it "reject! stores reason" do
      profile = create(:matching_profile)
      profile.reject!(reason: "Unclear photo")
      expect(profile.reload).to be_rejected
      expect(profile.moderation_reason).to eq("Unclear photo")
    end

    it "deactivate! flips is_active without touching moderation state" do
      profile = create(:matching_profile, :approved)
      profile.deactivate!
      expect(profile.reload.is_active).to be(false)
      expect(profile.reload).to be_approved
    end
  end

  describe "scopes" do
    let!(:pending)  { create(:matching_profile) }
    let!(:approved) { create(:matching_profile, :approved) }
    let!(:rejected) { create(:matching_profile, :rejected) }
    let!(:inactive_approved) { create(:matching_profile, :approved, :inactive) }

    it "visible_to_others returns only active + approved" do
      expect(MatchingProfile.visible_to_others).to contain_exactly(approved)
    end

    it "pending_review returns pending profiles" do
      expect(MatchingProfile.pending_review).to contain_exactly(pending)
    end
  end

  describe "moderation email side effect" do
    it "delivers approved email when state flips from pending to approved" do
      profile = create(:matching_profile)
      expect { profile.approve! }
        .to have_enqueued_mail(MatchingMailer, :approved)
    end

    it "delivers rejected email when state flips to rejected" do
      profile = create(:matching_profile)
      expect { profile.reject!(reason: "blurry") }
        .to have_enqueued_mail(MatchingMailer, :rejected)
    end

    it "does not deliver mail when only bio changes (state reset to pending is silent)" do
      profile = create(:matching_profile, :approved)
      expect { profile.update!(bio: "fresh") }
        .not_to have_enqueued_mail(MatchingMailer)
    end
  end
end

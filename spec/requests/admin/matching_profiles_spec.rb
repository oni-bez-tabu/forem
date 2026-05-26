require "rails_helper"

RSpec.describe "Admin::MatchingProfiles", type: :request do
  let(:admin) { create(:user, :super_admin) }
  let(:regular_user) { create(:user) }
  let!(:profile) { create(:matching_profile) }

  describe "GET /admin/.../matching_profiles" do
    context "as an admin" do
      before { sign_in admin }

      it "lists pending profiles by default" do
        get admin_matching_profiles_path
        expect(response).to have_http_status(:ok)
        expect(response.body).to include(profile.user.username)
      end

      it "filters by scope" do
        approved_profile = create(:matching_profile, :approved)
        get admin_matching_profiles_path(scope: "approved")
        expect(response.body).to include(approved_profile.user.username)
      end
    end

    context "as a regular user" do
      before { sign_in regular_user }
      it "denies access" do
        expect { get admin_matching_profiles_path }.to raise_error(Pundit::NotAuthorizedError)
      end
    end
  end

  describe "POST approve/reject/deactivate/reactivate" do
    before { sign_in admin }

    it "approves a pending profile" do
      post approve_admin_matching_profile_path(profile)
      expect(profile.reload).to be_approved
    end

    it "rejects with a reason" do
      post reject_admin_matching_profile_path(profile), params: { reason: "blurry photo" }
      profile.reload
      expect(profile).to be_rejected
      expect(profile.moderation_reason).to eq("blurry photo")
    end

    it "deactivates an approved profile" do
      approved = create(:matching_profile, :approved)
      post deactivate_admin_matching_profile_path(approved)
      expect(approved.reload.is_active).to be(false)
    end

    it "reactivates an inactive profile" do
      inactive = create(:matching_profile, :approved, :inactive)
      post reactivate_admin_matching_profile_path(inactive)
      expect(inactive.reload.is_active).to be(true)
    end

    it "destroys a profile" do
      expect { delete admin_matching_profile_path(profile) }
        .to change(MatchingProfile, :count).by(-1)
    end
  end
end

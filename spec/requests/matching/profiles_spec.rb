require "rails_helper"

RSpec.describe "Matching::Profiles" do
  let(:user) { create(:user) }
  let(:city) { create(:city) }

  let(:valid_params) do
    {
      matching_profile: {
        identity_type: "woman",
        city_id: city.id,
        bio: "Hi from the spec",
        photo: Rack::Test::UploadedFile.new(Rails.root.join("spec/fixtures/files/800x600.png"), "image/png")
      }
    }
  end

  describe "GET /matching/onboarding" do
    it "requires authentication" do
      get matching_onboarding_path
      expect(response).to have_http_status(:redirect)
    end

    context "as a signed-in user" do
      before { sign_in user }

      it "renders the E5 intro screen with the form CTA" do
        get matching_onboarding_path
        expect(response).to have_http_status(:ok)
        expect(response.body).to include(I18n.t("matching.onboarding.intro.cta_primary"))
      end

      it "redirects to /matching if a profile already exists" do
        create(:matching_profile, user: user)
        get matching_onboarding_path
        expect(response).to redirect_to(matching_path)
      end
    end

    context "as a suspended user" do
      before do
        user.add_role(:suspended)
        sign_in user
      end

      it "redirects to root" do
        get matching_onboarding_path
        expect(response).to redirect_to(root_path)
      end
    end
  end

  describe "GET /matching/onboarding/form" do
    before { sign_in user }

    it "renders the E6 form with the Krok 2 z 3 overline and submit label" do
      get matching_onboarding_form_path
      expect(response).to have_http_status(:ok)
      expect(response.body).to include(I18n.t("matching.onboarding.form_overline"))
      expect(response.body).to include(I18n.t("matching.onboarding.submit"))
    end
  end

  describe "GET /matching/onboarding/success" do
    context "without a profile" do
      before { sign_in user }

      it "redirects to the onboarding intro" do
        get matching_onboarding_success_path
        expect(response).to redirect_to(matching_onboarding_path)
      end
    end

    context "with a profile" do
      before do
        create(:matching_profile, user: user)
        sign_in user
      end

      it "renders the E7 success screen" do
        get matching_onboarding_success_path
        expect(response).to have_http_status(:ok)
        expect(response.body).to include(I18n.t("matching.onboarding.success.heading"))
        expect(response.body).to include(I18n.t("matching.onboarding.success.cta_primary"))
        expect(response.body).to include(I18n.t("matching.onboarding.success.cta_secondary"))
      end
    end

    it "requires authentication" do
      get matching_onboarding_success_path
      expect(response).to have_http_status(:redirect)
    end
  end

  describe "POST /matching/profile" do
    before { sign_in user }

    it "creates a profile in pending state" do
      expect { post matching_profile_path, params: valid_params }
        .to change(MatchingProfile, :count).by(1)
      profile = MatchingProfile.last
      expect(profile.user).to eq(user)
      expect(profile).to be_pending
    end

    it "redirects to the E7 success screen" do
      post matching_profile_path, params: valid_params
      expect(response).to redirect_to(matching_onboarding_success_path)
    end

    it "rejects invalid data" do
      bad = valid_params.deep_dup
      bad[:matching_profile][:identity_type] = ""
      expect { post matching_profile_path, params: bad }
        .not_to change(MatchingProfile, :count)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /matching/profile" do
    let!(:profile) { create(:matching_profile, :approved, user: user) }

    before { sign_in user }

    it "updates the profile and redirects to the settings tab" do
      patch matching_profile_path, params: { matching_profile: { bio: "Updated bio" } }
      expect(response).to redirect_to("/settings/matching")
      profile.reload
      expect(profile.bio).to eq("Updated bio")
      expect(profile).to be_pending
    end
  end

  describe "GET /matching/profile/edit" do
    before do
      create(:matching_profile, user: user)
      sign_in user
    end

    it "redirects to the settings tab (canonical edit URL)" do
      get edit_matching_profile_path
      expect(response).to redirect_to("/settings/matching")
    end
  end

  describe "POST /matching/profile/deactivate" do
    let!(:profile) { create(:matching_profile, :approved, user: user) }

    before { sign_in user }

    it "deactivates the profile" do
      post deactivate_matching_profile_path
      expect(response).to redirect_to("/settings/matching")
      expect(profile.reload.is_active).to be(false)
    end
  end

  describe "POST /matching/profile/reactivate" do
    let!(:profile) { create(:matching_profile, :approved, :inactive, user: user) }

    before { sign_in user }

    it "reactivates the profile" do
      post reactivate_matching_profile_path
      expect(response).to redirect_to("/settings/matching")
      expect(profile.reload.is_active).to be(true)
    end
  end

  describe "DELETE /matching/profile" do
    let!(:profile) { create(:matching_profile, user: user) }

    before { sign_in user }

    it "destroys the profile and redirects back to the empty dashboard" do
      expect { delete matching_profile_path }
        .to change(MatchingProfile, :count).by(-1)
      expect(response).to redirect_to(matching_path)
    end
  end
end

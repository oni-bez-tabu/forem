require "rails_helper"

# Hybrid SSR + Preact: profile header server-rendered (instant),
# activity feed Preact mounts on #matching-app. Tu sprawdzamy SSR
# część + obecność packa.
RSpec.describe "GET /matching" do
  context "without authentication" do
    it "redirects to a login flow" do
      get matching_path
      expect(response).to have_http_status(:redirect)
    end
  end

  context "as a signed-in user without a profile" do
    let(:user) { create(:user) }

    before { sign_in user }

    it "redirects straight to the onboarding intro" do
      get matching_path
      expect(response).to redirect_to(matching_onboarding_path)
    end
  end

  context "as a signed-in user with an approved+active profile" do
    let(:user) { create(:user) }
    let!(:profile) { create(:matching_profile, :approved, user: user) }

    before { sign_in user }

    it "renders the SSR profile header and the activity Preact mount point" do
      get matching_path
      expect(response).to have_http_status(:ok)
      expect(response.body).to include(I18n.t("matching.show.profile_title"))
      expect(response.body).to include(I18n.t("matching.show.profile_active_pill"))
      expect(response.body).to include('id="matching-app"')
      expect(response.body).to include("matchingDashboard")
    end
  end

  context "as a signed-in user with a pending profile" do
    let(:user) { create(:user) }
    let!(:profile) { create(:matching_profile, user: user, moderation_state: "pending") }

    before { sign_in user }

    it "renders the moderation notice and skips the activity mount point" do
      get matching_path
      expect(response.body).to include(I18n.t("matching.show.pending_explanation"))
      expect(response.body).not_to include('id="matching-app"')
    end
  end
end

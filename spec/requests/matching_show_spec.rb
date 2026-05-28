require "rails_helper"

# /matching is now a Preact SPA shell. The interactive bits (profile
# header, timeline, recommendations) are tested via
# spec/requests/api/v1/matching/dashboard_spec.rb. Here we only verify
# the shell + redirects + pack inclusion.
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

  context "as a signed-in user with a profile" do
    let(:user) { create(:user) }
    let!(:profile) { create(:matching_profile, :approved, user: user) }

    before { sign_in user }

    it "renders the SPA mount point with data attrs" do
      get matching_path
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('id="matching-app"')
      expect(response.body).to include("matchingDashboard")
    end

    it "regardless of moderation state — Preact decides what to show" do
      profile.update!(moderation_state: "pending")
      get matching_path
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('id="matching-app"')
    end
  end
end

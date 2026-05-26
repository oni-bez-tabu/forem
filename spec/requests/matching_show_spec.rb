require "rails_helper"

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

    it "renders the create-profile CTA" do
      get matching_path
      expect(response).to have_http_status(:ok)
      expect(response.body).to include(I18n.t("matching.show.create_profile"))
    end
  end

  context "as a signed-in user with a profile" do
    let(:user) { create(:user) }
    before do
      create(:matching_profile, :approved, user: user)
      sign_in user
    end

    it "renders the dashboard with the moderation badge" do
      get matching_path
      expect(response).to have_http_status(:ok)
      expect(response.body).to include(I18n.t("matching.moderation.approved"))
      expect(response.body).to include(I18n.t("matching.show.edit_profile"))
    end
  end
end

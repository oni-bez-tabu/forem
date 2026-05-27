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

  context "as a signed-in user with an approved+active profile" do
    let(:user) { create(:user) }
    let!(:profile) { create(:matching_profile, :approved, user: user) }
    before { sign_in user }

    it "renders the compact header and the manage-profile link" do
      get matching_path
      expect(response).to have_http_status(:ok)
      expect(response.body).to include(I18n.t("matching.moderation.approved"))
      expect(response.body).to include(I18n.t("matching.show.manage_profile"))
    end

    it "renders the timeline heading" do
      get matching_path
      expect(response.body).to include(I18n.t("matching.timeline.heading"))
    end

    it "renders the empty state when there are no events and no recommendations" do
      get matching_path
      expect(response.body).to include(I18n.t("matching.timeline.empty_state"))
    end

    it "renders an RSVP event in the timeline" do
      meetup = create(:meetup, name: "Demo Meetup")
      create(:meetup_rsvp, meetup: meetup, user: user, status: "going")
      get matching_path
      # New layout uses kind label + RSVP pill, not the old full sentence.
      expect(response.body).to include(I18n.t("matching.timeline.kind_labels.rsvp_created"))
      expect(response.body).to include(I18n.t("matching.timeline.events.rsvp_going_pill"))
      expect(response.body).to include("Demo Meetup")
    end

    it "renders a recommendation card when there are upcoming meetups in user's city" do
      create(:meetup, name: "Upcoming X", venue_city: profile.city, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
      get matching_path
      expect(response.body).to include("Upcoming X")
      expect(response.body).to include(I18n.t("matching.recommendations.label"))
    end
  end

  context "as a signed-in user with a pending profile" do
    let(:user) { create(:user) }
    let!(:profile) { create(:matching_profile, user: user) }
    before { sign_in user }

    it "shows the pending explanation instead of the timeline" do
      get matching_path
      expect(response.body).to include(I18n.t("matching.show.pending_explanation"))
      expect(response.body).not_to include(I18n.t("matching.timeline.heading"))
    end
  end
end

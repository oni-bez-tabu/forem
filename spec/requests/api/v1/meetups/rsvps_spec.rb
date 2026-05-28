require "rails_helper"

RSpec.describe "Api::V1::Meetups::Rsvps" do
  let(:v1_headers) do
    { "content-type" => "application/json", "Accept" => "application/vnd.forem.api-v1+json" }
  end
  let(:api_secret) { create(:api_secret) }
  let(:user) { api_secret.user }
  let(:auth_header) { v1_headers.merge({ "api-key" => api_secret.secret }) }
  let(:meetup) { create(:meetup) }
  let(:path) { api_meetup_rsvp_path(slug: meetup.slug) }

  describe "POST" do
    it "creates a 'going' RSVP" do
      expect do
        post path, params: { status: "going" }.to_json, headers: auth_header
      end.to change(MeetupRsvp, :count).by(1)
      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body.dig("rsvp", "status")).to eq("going")
      expect(body.dig("counts", "going")).to eq(1)
    end

    it "updates status when posting a different one (going → interested)" do
      post path, params: { status: "going" }.to_json, headers: auth_header
      post path, params: { status: "interested" }.to_json, headers: auth_header
      expect(response).to have_http_status(:ok)
      expect(MeetupRsvp.find_by(meetup_id: meetup.id, user_id: user.id).status).to eq("interested")
    end

    it "indicates needs_declaration_prompt when user has profile+going+no declaration" do
      create(:matching_profile, :approved, user: user)
      post path, params: { status: "going" }.to_json, headers: auth_header
      expect(response.parsed_body["needs_declaration_prompt"]).to be(true)
    end

    it "doesn't prompt for declaration when one already exists" do
      profile = create(:matching_profile, :approved, user: user)
      create(:meetup_rsvp, meetup: meetup, user: user, status: "interested")
      create(:meetup_matching_declaration, meetup: meetup, matching_profile: profile)
      post path, params: { status: "going" }.to_json, headers: auth_header
      expect(response.parsed_body["needs_declaration_prompt"]).to be(false)
    end

    it "401s without auth" do
      post path, params: { status: "going" }.to_json, headers: v1_headers
      expect(response).to have_http_status(:unauthorized)
    end

    it "422s for an unknown status" do
      post path, params: { status: "maybe" }.to_json, headers: auth_header
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "404s for an expired meetup" do
      expired = create(:meetup, :expired_for_lists)
      post api_meetup_rsvp_path(slug: expired.slug),
           params: { status: "going" }.to_json,
           headers: auth_header
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE" do
    it "removes the user's RSVP" do
      create(:meetup_rsvp, meetup: meetup, user: user, status: "going")
      expect do
        delete path, headers: auth_header
      end.to change(MeetupRsvp, :count).by(-1)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["rsvp"]).to be_nil
      expect(response.parsed_body.dig("counts", "going")).to eq(0)
    end

    it "is idempotent if no RSVP existed" do
      delete path, headers: auth_header
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["rsvp"]).to be_nil
    end
  end
end

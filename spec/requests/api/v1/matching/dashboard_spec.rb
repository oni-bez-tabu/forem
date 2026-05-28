require "rails_helper"

RSpec.describe "Api::V1::Matching::Dashboard" do
  let(:v1_headers) do
    { "content-type" => "application/json", "Accept" => "application/vnd.forem.api-v1+json" }
  end
  let(:api_secret) { create(:api_secret) }
  let(:user) { api_secret.user }
  let(:auth_header) { v1_headers.merge({ "api-key" => api_secret.secret }) }
  let(:path) { "/api/matching/dashboard" }

  it "401s without auth" do
    get path, headers: v1_headers
    expect(response).to have_http_status(:unauthorized)
  end

  it "returns profile=null when the user has no matching profile" do
    get path, headers: auth_header
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq({ "profile" => nil })
  end

  context "with a pending profile" do
    let!(:profile) { create(:matching_profile, user: user, moderation_state: "pending") }

    it "returns profile + timeline/recommendations as null" do
      get path, headers: auth_header
      body = response.parsed_body
      expect(body.dig("profile", "moderation_state")).to eq("pending")
      expect(body.dig("profile", "visible_to_others")).to be(false)
      expect(body["timeline"]).to be_nil
      expect(body["recommendations"]).to be_nil
    end
  end

  context "with an approved+active profile" do
    let!(:profile) { create(:matching_profile, :approved, user: user) }
    let!(:meetup) do
      create(:meetup, venue_city: profile.city, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
    end
    let!(:rsvp) { create(:meetup_rsvp, meetup: meetup, user: user, status: "going") }

    it "returns profile + timeline + recommendations" do
      get path, headers: auth_header
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.dig("profile", "visible_to_others")).to be(true)
      expect(body["timeline"]).to be_an(Array)
      # rsvp_created event for the meetup we just RSVPed to + needs_intent (no declaration)
      types = body["timeline"].map { |e| e["type"] }
      expect(types).to include("rsvp_created")
      expect(types).to include("needs_intent")
      expect(body["recommendations"]).to be_an(Array)
    end

    it "serializes meetup brief inside events" do
      get path, headers: auth_header
      event = response.parsed_body["timeline"].find { |e| e["type"] == "rsvp_created" }
      expect(event.dig("meetup", "slug")).to eq(meetup.slug)
      expect(event.dig("meetup", "name")).to eq(meetup.name)
      expect(event.dig("meetup", "start_at")).to be_present
    end
  end
end

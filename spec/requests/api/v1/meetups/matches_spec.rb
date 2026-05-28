require "rails_helper"

RSpec.describe "Api::V1::Meetups::Matches" do
  let(:v1_headers) { { "Accept" => "application/vnd.forem.api-v1+json" } }
  let(:api_secret) { create(:api_secret) }
  let(:user) { api_secret.user }
  let(:auth) { v1_headers.merge({ "api-key" => api_secret.secret }) }
  let(:meetup) { create(:meetup) }
  let!(:viewer_profile) { create(:matching_profile, :approved, user: user) }
  let!(:viewer_rsvp) { create(:meetup_rsvp, meetup: meetup, user: user, status: "going") }
  let!(:viewer_declaration) do
    create(:meetup_matching_declaration, meetup: meetup, matching_profile: viewer_profile, intent_level: "open_to_meet")
  end

  let(:path) { "/api/meetups/#{meetup.slug}/matches" }

  it "returns same/other intent groups for a P3 viewer" do
    other_open = create(:matching_profile, :approved)
    other_vibe = create(:matching_profile, :approved)
    create(:meetup_matching_declaration, meetup: meetup, matching_profile: other_open, intent_level: "open_to_meet")
    create(:meetup_matching_declaration, meetup: meetup, matching_profile: other_vibe, intent_level: "just_vibe")

    get path, headers: auth
    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body["viewer_intent_level"]).to eq("open_to_meet")
    same_ids = body["same_intent"].map { |m| m.dig("profile", "id") }
    other_ids = body["other_intent"].map { |m| m.dig("profile", "id") }
    expect(same_ids).to include(other_open.id)
    expect(other_ids).to include(other_vibe.id)
  end

  it "401s without auth" do
    get path, headers: v1_headers
    expect(response).to have_http_status(:unauthorized)
  end

  it "403s when viewer has no visible profile" do
    viewer_profile.update!(moderation_state: "pending")
    get path, headers: auth
    expect(response).to have_http_status(:forbidden)
    expect(response.parsed_body["error"]).to eq("profile_required")
  end

  it "403s when viewer has no declaration / not_looking" do
    viewer_declaration.update!(intent_level: "not_looking")
    get path, headers: auth
    expect(response).to have_http_status(:forbidden)
    expect(response.parsed_body["error"]).to eq("declaration_required")
  end

  it "404s for unknown meetup" do
    get "/api/meetups/nope/matches", headers: auth
    expect(response).to have_http_status(:not_found)
  end
end

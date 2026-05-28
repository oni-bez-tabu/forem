require "rails_helper"

RSpec.describe "Api::V1::Matching::EventScopedProfiles" do
  let(:v1_headers) { { "Accept" => "application/vnd.forem.api-v1+json" } }
  let(:api_secret) { create(:api_secret) }
  let(:user) { api_secret.user }
  let(:auth) { v1_headers.merge({ "api-key" => api_secret.secret }) }

  let(:meetup) { create(:meetup) }
  let!(:viewer_profile) { create(:matching_profile, :approved, user: user) }
  let!(:viewer_rsvp) { create(:meetup_rsvp, meetup: meetup, user: user, status: "going") }
  let!(:viewer_dec) do
    create(:meetup_matching_declaration, meetup: meetup, matching_profile: viewer_profile, intent_level: "open_to_meet")
  end

  let(:other_profile) { create(:matching_profile, :approved) }
  let!(:other_dec) do
    create(:meetup_matching_declaration, meetup: meetup, matching_profile: other_profile, intent_level: "open_to_meet")
  end

  let(:path) { "/api/matching/m/#{meetup.slug}/#{other_profile.id}" }

  it "returns serialized profile + declaration + meetup + welcome flags" do
    get path, headers: auth
    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body.dig("profile", "id")).to eq(other_profile.id)
    expect(body.dig("declaration", "intent_level")).to eq("open_to_meet")
    expect(body.dig("meetup", "slug")).to eq(meetup.slug)
    expect(body["welcome_eligible"]).to be(true)
    expect(body["welcome_already_sent"]).to be(false)
  end

  it "flags welcome_already_sent when one exists" do
    create(:matching_welcome, sender_profile: viewer_profile, receiver_profile: other_profile, meetup: meetup)
    get path, headers: auth
    expect(response.parsed_body["welcome_already_sent"]).to be(true)
    expect(response.parsed_body["welcome_eligible"]).to be(false)
  end

  it "401s without auth" do
    get path, headers: v1_headers
    expect(response).to have_http_status(:unauthorized)
  end

  it "404s for not_looking declaration on the other profile" do
    other_dec.update!(intent_level: "not_looking")
    get path, headers: auth
    expect(response).to have_http_status(:not_found)
  end

  it "404s past the 48h lifecycle window" do
    meetup.update!(start_at: 3.days.ago, end_at: 3.days.ago + 2.hours)
    get path, headers: auth
    expect(response).to have_http_status(:not_found)
  end
end

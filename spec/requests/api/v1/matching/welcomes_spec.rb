require "rails_helper"

RSpec.describe "Api::V1::Matching::Welcomes" do
  let(:v1_headers) do
    { "content-type" => "application/json", "Accept" => "application/vnd.forem.api-v1+json" }
  end
  let(:api_secret) { create(:api_secret) }
  let(:sender_user) { api_secret.user }
  let(:auth_header) { v1_headers.merge({ "api-key" => api_secret.secret }) }
  let!(:sender) { create(:matching_profile, :approved, user: sender_user) }
  let(:receiver) { create(:matching_profile, :approved) }
  let(:meetup) { create(:meetup) }
  let!(:sender_dec) do
    create(:meetup_matching_declaration, meetup: meetup, matching_profile: sender, intent_level: "open_to_meet")
  end
  let!(:receiver_dec) do
    create(:meetup_matching_declaration, meetup: meetup, matching_profile: receiver, intent_level: "open_to_meet")
  end
  let(:path) { api_matching_welcomes_path }
  let(:valid_payload) { { receiver_profile_id: receiver.id, meetup_id: meetup.id } }

  it "creates a welcome and reports stubbed delivery (no CF URL configured)" do
    expect do
      post path, params: valid_payload.to_json, headers: auth_header
    end.to change(MatchingWelcome, :count).by(1)
    expect(response).to have_http_status(:created)
    body = response.parsed_body
    expect(body["ok"]).to be(true)
    expect(body["welcome_id"]).to eq(MatchingWelcome.last.id)
    expect(body["delivery"]).to eq("stubbed")
  end

  it "401s without auth" do
    post path, params: valid_payload.to_json, headers: v1_headers
    expect(response).to have_http_status(:unauthorized)
  end

  it "403s when sender profile is inactive" do
    sender.update!(is_active: false)
    post path, params: valid_payload.to_json, headers: auth_header
    expect(response).to have_http_status(:forbidden)
  end

  it "409s on duplicate (same sender/receiver pair, regardless of meetup)" do
    create(:matching_welcome, sender_profile: sender, receiver_profile: receiver, meetup: meetup)
    post path, params: valid_payload.to_json, headers: auth_header
    expect(response).to have_http_status(:conflict)
  end

  it "422s when either side declared not_looking" do
    sender_dec.update!(intent_level: "not_looking")
    post path, params: valid_payload.to_json, headers: auth_header
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it "404s for an expired meetup (past R-Lifecycle 48h window)" do
    expired = create(:meetup, start_at: 3.days.ago, end_at: 3.days.ago + 2.hours)
    create(:meetup_matching_declaration, meetup: expired, matching_profile: sender, intent_level: "open_to_meet")
    create(:meetup_matching_declaration, meetup: expired, matching_profile: receiver, intent_level: "open_to_meet")
    post path, params: valid_payload.merge(meetup_id: expired.id).to_json, headers: auth_header
    expect(response).to have_http_status(:not_found)
  end

  it "422s when sender == receiver" do
    post path, params: valid_payload.merge(receiver_profile_id: sender.id).to_json, headers: auth_header
    expect(response).to have_http_status(:unprocessable_entity)
  end
end

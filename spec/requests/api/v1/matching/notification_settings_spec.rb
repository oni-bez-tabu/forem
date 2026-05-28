require "rails_helper"

RSpec.describe "Api::V1::Matching::NotificationSettings" do
  let(:v1_headers) { { "Accept" => "application/vnd.forem.api-v1+json" } }
  let(:api_secret) { create(:api_secret) }
  let(:user) { api_secret.user }
  let(:auth) { v1_headers.merge({ "api-key" => api_secret.secret }) }
  let(:path) { "/api/matching/notification_settings" }

  it "401s without auth" do
    get path, headers: v1_headers
    expect(response).to have_http_status(:unauthorized)
  end

  it "returns current settings (defaults: both true)" do
    get path, headers: auth
    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body.dig("settings", "notify_on_new_matches")).to be(true)
    expect(body.dig("settings", "notify_on_new_city_meetups")).to be(true)
  end

  it "updates toggles via PATCH" do
    patch path,
          params: { settings: { notify_on_new_matches: false } }.to_json,
          headers: auth.merge({ "content-type" => "application/json" })
    expect(response).to have_http_status(:ok)
    user.notification_setting.reload
    expect(user.notification_setting.notify_on_new_matches).to be(false)
  end
end

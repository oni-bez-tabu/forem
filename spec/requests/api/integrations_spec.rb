require "rails_helper"

RSpec.describe "Api::Integrations" do
  let(:user) { create(:user) }
  let(:memory_cache) { ActiveSupport::Cache::MemoryStore.new }

  before do
    allow(Rails).to receive(:cache).and_return(memory_cache)
    allow(ApplicationConfig).to receive(:[]).and_call_original
    allow(ApplicationConfig).to receive(:[]).with("INTEGRATIONS_API_KEYS").and_return("strefa-pary:sekret-testowy")
    allow(ApplicationConfig).to receive(:[]).with("INTEGRATIONS_JWT_AUDIENCES").and_return("strefa-pary")
  end

  describe "GET /api/integrations/token" do
    it "returns 401 when logged out" do
      get "/api/integrations/token", params: { aud: "strefa-pary" }
      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["error"]).to eq("unauthorized")
    end

    it "returns a valid RS256 JWT for the logged-in user" do
      sign_in user
      get "/api/integrations/token", params: { aud: "strefa-pary" }
      expect(response).to have_http_status(:ok)
      expect(response.headers["Cache-Control"]).to include("no-store")

      body = response.parsed_body
      expect(body["exp"]).to be > Time.current.to_i

      jwk = Integrations::JwtKeys.jwk
      public_key = JWT::JWK.import(jwk.stringify_keys).public_key
      payload, header = JWT.decode(body["token"], public_key, true,
                                   algorithm: "RS256", aud: "strefa-pary", verify_aud: true)
      expect(header["kid"]).to eq(Integrations::JwtKeys.kid)
      expect(payload["sub"]).to eq(user.id.to_s)
      expect(payload["username"]).to eq(user.username)
      expect(payload["iss"]).to eq(Settings::General.app_domain)
      expect(payload["exp"] - payload["iat"]).to eq(15.minutes.to_i)
    end

    it "returns 422 for an unknown aud" do
      sign_in user
      get "/api/integrations/token", params: { aud: "obca-aplikacja" }
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "returns 422 when aud is missing" do
      sign_in user
      get "/api/integrations/token"
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "JWKS" do
    it "publishes the public key at /.well-known/jwks.json" do
      get "/.well-known/jwks.json"
      expect(response).to have_http_status(:ok)
      expect(response.headers["Cache-Control"]).to include("public")
      key = response.parsed_body["keys"].first
      expect(key).to include("kty" => "RSA", "alg" => "RS256", "use" => "sig", "kid" => Integrations::JwtKeys.kid)
      expect(key["n"]).to be_present
      expect(key["e"]).to be_present
    end

    it "serves the same keys at /api/integrations/jwks" do
      get "/api/integrations/jwks"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["keys"].first["kid"]).to eq(Integrations::JwtKeys.kid)
    end
  end

  describe "POST /api/integrations/notifications" do
    let(:headers) { { "api-key" => "sekret-testowy", "Content-Type" => "application/json" } }
    let(:payload) do
      {
        user_id: user.id,
        kategoria: "zadanie",
        tytul: "Ola: zadanie zrobione — Twoja kolej",
        tresc: "Wejdź do Strefy Pary",
        url: "/strefa-pary",
        klucz_deduplikacji: "zadanie-T-E3-01-#{user.id}"
      }
    end

    before { allow(PushNotifications::Send).to receive(:call) }

    it "returns 401 without a valid api key" do
      post "/api/integrations/notifications", params: payload.to_json, headers: headers.merge("api-key" => "zly")
      expect(response).to have_http_status(:unauthorized)
      expect(Notification.count).to eq(0)
    end

    it "creates a notification in the bell and sends a push" do
      expect do
        post "/api/integrations/notifications", params: payload.to_json, headers: headers
      end.to change(Notification, :count).by(1).and change(IntegrationNotification, :count).by(1)

      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body).to eq("ok" => true)

      notification = Notification.last
      expect(notification.user_id).to eq(user.id)
      expect(notification.notifiable).to be_a(IntegrationNotification)
      expect(notification.json_data.dig("integration", "title")).to eq(payload[:tytul])
      expect(notification.notifiable.scope).to eq("strefa-pary")

      expect(PushNotifications::Send).to have_received(:call).with(
        user_ids: [user.id],
        title: payload[:tytul],
        body: payload[:tresc],
        payload: hash_including(url: URL.url("/strefa-pary"), type: "integration"),
      )
    end

    it "deduplicates by klucz_deduplikacji" do
      post "/api/integrations/notifications", params: payload.to_json, headers: headers
      expect(response).to have_http_status(:accepted)

      expect do
        post "/api/integrations/notifications", params: payload.to_json, headers: headers
      end.not_to change(Notification, :count)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq("ok" => true, "dedup" => true)
    end

    it "skips the push when the user disabled integration notifications" do
      user.notification_setting.update!(mobile_integration_notifications: false)
      post "/api/integrations/notifications", params: payload.to_json, headers: headers
      expect(response).to have_http_status(:accepted)
      expect(Notification.count).to eq(1)
      expect(PushNotifications::Send).not_to have_received(:call)
    end

    it "returns 422 without a title" do
      post "/api/integrations/notifications", params: payload.merge(tytul: "").to_json, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["ok"]).to be(false)
    end

    it "returns 422 for an unknown user" do
      post "/api/integrations/notifications", params: payload.merge(user_id: 0).to_json, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "rate limits after the daily limit" do
      limit = Integrations::NotificationSend::DAILY_LIMIT
      limit.times do |i|
        body = payload.merge(klucz_deduplikacji: "k#{i}").to_json
        post "/api/integrations/notifications", params: body, headers: headers
        expect(response).to have_http_status(:accepted)
      end
      body = payload.merge(klucz_deduplikacji: "ostatni").to_json
      post "/api/integrations/notifications", params: body, headers: headers
      expect(response).to have_http_status(:too_many_requests)
    end

    it "renders the notification in the notifications list" do
      post "/api/integrations/notifications", params: payload.to_json, headers: headers
      sign_in user
      get "/notifications"
      expect(response.body).to include(CGI.escapeHTML(payload[:tytul]))
      expect(response.body).to include('href="/strefa-pary"')
    end
  end
end

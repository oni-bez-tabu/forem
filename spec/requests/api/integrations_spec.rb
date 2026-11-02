require "rails_helper"

RSpec.describe "Api::Integrations" do
  let(:user) { create(:user) }
  let(:memory_cache) { ActiveSupport::Cache::MemoryStore.new }

  before do
    allow(Rails).to receive(:cache).and_return(memory_cache)
    allow(ApplicationConfig).to receive(:[]).and_call_original
    allow(ApplicationConfig).to receive(:[]).with("INTEGRATIONS_API_KEYS").and_return("strefa-pary:sekret-testowy")
  end

  describe "GET /api/integrations/me" do
    let(:token) { JWT.encode({ user_id: user.id, exp: 5.minutes.from_now.to_i }, Rails.application.secret_key_base) }

    it "returns 401 without a token" do
      get "/api/integrations/me"
      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["error"]).to eq("unauthorized")
    end

    it "returns 401 for a token with a bad signature" do
      bad = JWT.encode({ user_id: user.id, exp: 5.minutes.from_now.to_i }, "inny-sekret")
      get "/api/integrations/me", headers: { "Authorization" => "Bearer #{bad}" }
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 for an expired token" do
      old = JWT.encode({ user_id: user.id, exp: 1.minute.ago.to_i }, Rails.application.secret_key_base)
      get "/api/integrations/me", headers: { "Authorization" => "Bearer #{old}" }
      expect(response).to have_http_status(:unauthorized)
    end

    it "identifies the user from the Forem auth token (the one /auth_pass/iframe issues)" do
      get "/api/integrations/me", headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:ok)
      expect(response.headers["Cache-Control"]).to include("no-store")
      expect(response.parsed_body).to eq("id" => user.id.to_s, "name" => user.name, "username" => user.username)
    end

    it "ignores the cookie session (token only)" do
      sign_in user
      get "/api/integrations/me"
      expect(response).to have_http_status(:unauthorized)
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

    it "stores the actor (avatar) and renders it in the notifications list" do
      actor = create(:user, name: "Ola")
      post "/api/integrations/notifications", params: payload.merge(nadawca_id: actor.id, tresc: "Ola: zadanie zrobione").to_json, headers: headers
      expect(response).to have_http_status(:accepted)
      data = Notification.last.json_data["integration"]
      expect(data["actor"]).to include("id" => actor.id, "name" => "Ola", "profile_image_90" => actor.profile_image_90)

      sign_in user
      get "/notifications"
      expect(response.body).to include(actor.profile_image_90)
      expect(response.body).to include("<b class=\"fw-bold\">Ola</b>: zadanie zrobione")
    end

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

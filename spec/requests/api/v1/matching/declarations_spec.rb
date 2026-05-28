require "rails_helper"

RSpec.describe "Api::V1::Matching::Declarations" do
  let(:v1_headers) do
    { "content-type" => "application/json", "Accept" => "application/vnd.forem.api-v1+json" }
  end

  let(:api_secret) { create(:api_secret) }
  let(:user) { api_secret.user }
  let(:auth_header) { v1_headers.merge({ "api-key" => api_secret.secret }) }
  let(:meetup) { create(:meetup) }
  let!(:profile) { create(:matching_profile, :approved, user: user) }
  let!(:rsvp) { create(:meetup_rsvp, meetup: meetup, user: user, status: "going") }

  let(:path) { api_matching_declaration_path(meetup_slug: meetup.slug) }
  let(:valid_payload) do
    { declaration: { intent_level: "open_to_meet", meetup_note: "From the API spec" } }
  end

  describe "POST (create/upsert)" do
    it "creates the declaration with api-key auth (mobile flow)" do
      expect do
        post path, params: valid_payload.to_json, headers: auth_header
      end.to change(MeetupMatchingDeclaration, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["ok"]).to be(true)
      expect(body.dig("declaration", "intent_level")).to eq("open_to_meet")
      expect(body.dig("declaration", "meetup_slug")).to eq(meetup.slug)
    end

    it "creates the declaration with current_user (web session flow)" do
      sign_in user
      expect do
        post path, params: valid_payload.to_json, headers: v1_headers
      end.to change(MeetupMatchingDeclaration, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it "upserts on second POST instead of erroring with uniqueness violation" do
      create(:meetup_matching_declaration, meetup: meetup, matching_profile: profile, intent_level: "just_vibe")
      post path,
           params: { declaration: { intent_level: "open_to_meet", meetup_note: "new" } }.to_json,
           headers: auth_header
      expect(response).to have_http_status(:ok)
      declaration = MeetupMatchingDeclaration.find_by(meetup_id: meetup.id, matching_profile_id: profile.id)
      expect(declaration.intent_level).to eq("open_to_meet")
      expect(declaration.meetup_note).to eq("new")
    end

    it "returns 422 for an invalid intent level" do
      bad = valid_payload.deep_dup
      bad[:declaration][:intent_level] = "bogus"
      post path, params: bad.to_json, headers: auth_header
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "401s without auth (no api-key, no session)" do
      post path, params: valid_payload.to_json, headers: v1_headers
      expect(response).to have_http_status(:unauthorized)
    end

    it "403s when the user has no visible matching profile" do
      profile.update!(moderation_state: "pending")
      post path, params: valid_payload.to_json, headers: auth_header
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body["error"]).to eq("profile_required")
    end

    it "403s when the user hasn't RSVPed yet" do
      rsvp.destroy
      post path, params: valid_payload.to_json, headers: auth_header
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body["error"]).to eq("rsvp_required")
    end

    it "404s for an expired meetup (outside lifecycle window)" do
      expired = create(:meetup, :expired_for_lists)
      create(:meetup_rsvp, meetup: expired, user: user, status: "going")
      post api_matching_declaration_path(meetup_slug: expired.slug),
           params: valid_payload.to_json,
           headers: auth_header
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PATCH (update/upsert)" do
    let!(:existing) do
      create(:meetup_matching_declaration, meetup: meetup, matching_profile: profile, intent_level: "just_vibe")
    end

    it "updates the existing declaration" do
      patch path,
            params: { declaration: { intent_level: "open_to_meet", meetup_note: "updated" } }.to_json,
            headers: auth_header
      expect(response).to have_http_status(:ok)
      existing.reload
      expect(existing.intent_level).to eq("open_to_meet")
      expect(existing.meetup_note).to eq("updated")
    end
  end

  describe "GET (show)" do
    it "returns the meetup context with declaration=null when none exists yet" do
      get path, headers: auth_header
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["declaration"]).to be_nil
      expect(body.dig("meetup", "slug")).to eq(meetup.slug)
      expect(body.dig("meetup", "name")).to eq(meetup.name)
    end

    it "returns the serialized declaration when present" do
      declaration = create(:meetup_matching_declaration, meetup: meetup, matching_profile: profile,
                                                         intent_level: "just_vibe", meetup_note: "hi")
      get path, headers: auth_header
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.dig("declaration", "id")).to eq(declaration.id)
      expect(body.dig("declaration", "intent_level")).to eq("just_vibe")
      expect(body.dig("declaration", "meetup_note")).to eq("hi")
      expect(body.dig("meetup", "name")).to eq(meetup.name)
    end
  end

  describe "DELETE" do
    let!(:existing) do
      create(:meetup_matching_declaration, meetup: meetup, matching_profile: profile)
    end

    it "removes the declaration" do
      expect do
        delete path, headers: auth_header
      end.to change(MeetupMatchingDeclaration, :count).by(-1)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["ok"]).to be(true)
    end

    it "404s if no declaration to delete" do
      existing.destroy
      delete path, headers: auth_header
      expect(response).to have_http_status(:not_found)
    end
  end
end

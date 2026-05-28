require "rails_helper"

RSpec.describe "Api::V1::Matching::Profiles" do
  let(:v1_headers) do
    { "Accept" => "application/vnd.forem.api-v1+json" }
  end
  let(:api_secret) { create(:api_secret) }
  let(:user) { api_secret.user }
  let(:auth_header) { v1_headers.merge({ "api-key" => api_secret.secret }) }
  let(:city) { create(:city) }

  let(:photo) { Rack::Test::UploadedFile.new(Rails.root.join("spec/fixtures/files/800x600.png"), "image/png") }
  let(:valid_params) do
    {
      profile: {
        identity_type: "woman",
        city_id: city.id,
        bio: "Hi from the API spec",
        photo: photo,
      },
    }
  end

  describe "POST /api/matching/profile" do
    it "creates a profile in pending state (multipart with photo)" do
      expect do
        post "/api/matching/profile", params: valid_params, headers: auth_header
      end.to change(MatchingProfile, :count).by(1)
      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["ok"]).to be(true)
      expect(body.dig("profile", "identity_type")).to eq("woman")
      expect(body.dig("profile", "moderation_state")).to eq("pending")
    end

    it "401s without auth" do
      post "/api/matching/profile", params: valid_params, headers: v1_headers
      expect(response).to have_http_status(:unauthorized)
    end

    it "422s when profile already exists" do
      create(:matching_profile, user: user)
      post "/api/matching/profile", params: valid_params, headers: auth_header
      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["error"]).to eq("profile_exists")
    end

    it "422s for invalid identity type" do
      bad = valid_params.deep_dup
      bad[:profile][:identity_type] = "bogus"
      post "/api/matching/profile", params: bad, headers: auth_header
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "GET /api/matching/profile" do
    it "returns profile=null when none exists" do
      get "/api/matching/profile", headers: auth_header
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq({ "profile" => nil })
    end

    it "returns the serialized profile when present" do
      profile = create(:matching_profile, :approved, user: user, bio: "Hello")
      get "/api/matching/profile", headers: auth_header
      body = response.parsed_body
      expect(body.dig("profile", "id")).to eq(profile.id)
      expect(body.dig("profile", "bio")).to eq("Hello")
      expect(body.dig("profile", "visible_to_others")).to be(true)
    end
  end

  describe "PATCH /api/matching/profile" do
    let!(:profile) { create(:matching_profile, :approved, user: user, bio: "Old") }

    it "updates bio and bumps moderation back to pending" do
      patch "/api/matching/profile",
            params: { profile: { bio: "Updated bio" } },
            headers: auth_header
      expect(response).to have_http_status(:ok)
      profile.reload
      expect(profile.bio).to eq("Updated bio")
      expect(profile).to be_pending
    end
  end

  describe "DELETE /api/matching/profile" do
    let!(:profile) { create(:matching_profile, user: user) }

    it "removes the profile" do
      expect do
        delete "/api/matching/profile", headers: auth_header
      end.to change(MatchingProfile, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end
  end

  describe "POST /api/matching/profile/deactivate + /reactivate" do
    let!(:profile) { create(:matching_profile, :approved, user: user) }

    it "toggles is_active" do
      post "/api/matching/profile/deactivate", headers: auth_header
      expect(profile.reload.is_active).to be(false)
      post "/api/matching/profile/reactivate", headers: auth_header
      expect(profile.reload.is_active).to be(true)
    end
  end
end

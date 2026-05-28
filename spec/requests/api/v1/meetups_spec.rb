require "rails_helper"

RSpec.describe "Api::V1::Meetups (read)" do
  let(:v1_headers) do
    { "Accept" => "application/vnd.forem.api-v1+json" }
  end

  describe "GET /api/meetups" do
    let!(:warsaw) { create(:city, name: "Warszawa", slug: "warszawa-#{SecureRandom.hex(3)}") }
    let!(:krakow) { create(:city, name: "Kraków", slug: "krakow-#{SecureRandom.hex(3)}") }
    let!(:w_meetup) do
      create(:meetup, name: "WW", venue_city: warsaw, start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
    end
    let!(:k_meetup) do
      create(:meetup, name: "KK", venue_city: krakow, start_at: 3.days.from_now, end_at: 3.days.from_now + 2.hours)
    end

    it "returns all visible meetups paginated" do
      get "/api/meetups", headers: v1_headers
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      slugs = body["meetups"].map { |m| m["slug"] }
      expect(slugs).to include(w_meetup.slug, k_meetup.slug)
      expect(body["page"]).to eq(1)
      expect(body["has_more"]).to be(false)
    end

    it "filters by city_id" do
      get "/api/meetups", params: { city_id: warsaw.id }, headers: v1_headers
      slugs = response.parsed_body["meetups"].map { |m| m["slug"] }
      expect(slugs).to include(w_meetup.slug)
      expect(slugs).not_to include(k_meetup.slug)
    end

    it "excludes expired meetups (lifecycle filter)" do
      expired = create(:meetup, :expired_for_lists, venue_city: warsaw)
      get "/api/meetups", headers: v1_headers
      slugs = response.parsed_body["meetups"].map { |m| m["slug"] }
      expect(slugs).not_to include(expired.slug)
    end

    it "is public (no auth required)" do
      get "/api/meetups", headers: v1_headers
      expect(response).to have_http_status(:ok)
    end
  end

  describe "GET /api/meetups/:slug" do
    let!(:meetup) { create(:meetup, name: "Hub Demo") }

    it "returns full meetup payload (public, no auth)" do
      get "/api/meetups/#{meetup.slug}", headers: v1_headers
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.dig("meetup", "slug")).to eq(meetup.slug)
      expect(body.dig("meetup", "name")).to eq("Hub Demo")
      expect(body.dig("meetup", "match_pool_count")).to be_a(Integer)
      expect(body.dig("meetup", "current_user_rsvp_status")).to be_nil
    end

    it "404s for unknown slug" do
      get "/api/meetups/no-such-thing", headers: v1_headers
      expect(response).to have_http_status(:not_found)
    end

    it "includes current_user_rsvp_status when authenticated" do
      api_secret = create(:api_secret)
      create(:meetup_rsvp, meetup: meetup, user: api_secret.user, status: "going")
      get "/api/meetups/#{meetup.slug}",
          headers: v1_headers.merge({ "api-key" => api_secret.secret })
      expect(response.parsed_body.dig("meetup", "current_user_rsvp_status")).to eq("going")
    end
  end
end

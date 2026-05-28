require "rails_helper"

RSpec.describe "Api::V1::Cities" do
  let(:v1_headers) do
    { "content-type" => "application/json", "Accept" => "application/vnd.forem.api-v1+json" }
  end

  describe "GET /api/cities/search" do
    before do
      create(:city, name: "Warszawa", slug: "warszawa-#{SecureRandom.hex(3)}", population_hint: 1_000_000)
      create(:city, name: "Wrocław", slug: "wroclaw-#{SecureRandom.hex(3)}", population_hint: 600_000)
      create(:city, name: "Kraków", slug: "krakow-#{SecureRandom.hex(3)}", population_hint: 750_000)
    end

    it "returns cities matching the prefix in a {cities: [...]} envelope" do
      get api_cities_search_path, params: { q: "war" }, headers: v1_headers
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body).to have_key("cities")
      names = body["cities"].map { |c| c["name"] }
      expect(names).to include("Warszawa")
      expect(names).not_to include("Kraków")
    end

    it "returns an empty list (with envelope) when nothing matches" do
      get api_cities_search_path, params: { q: "zzz" }, headers: v1_headers
      expect(response.parsed_body).to eq({ "cities" => [] })
    end

    it "does not require authentication (public reference data)" do
      get api_cities_search_path, params: { q: "war" }, headers: v1_headers
      expect(response).to have_http_status(:ok)
    end
  end
end

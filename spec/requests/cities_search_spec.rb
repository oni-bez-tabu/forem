require "rails_helper"

RSpec.describe "GET /cities/search" do
  let!(:warsaw)  { create(:city, name: "Warszawa", population_hint: 1_700_000) }
  let!(:wroclaw) { create(:city, name: "Wrocław",  population_hint: 640_000) }
  let!(:lodz)    { create(:city, name: "Łódź",     population_hint: 680_000) }
  let!(:everywhere) do
    create(:city, name: "🌍 Wszędzie", slug: "everywhere", is_special: true, population_hint: nil)
  end

  def search(query)
    get "/cities/search", params: { q: query }
    expect(response).to have_http_status(:ok)
    response.parsed_body
  end

  it "returns matching cities serialized with expected fields" do
    body = search("war")
    expect(body).to be_an(Array)
    expect(body.first.keys).to match_array(%w[id name slug voivodeship is_special])
  end

  it "prefix-matches by normalized name" do
    body = search("war")
    slugs = body.pluck("slug")
    expect(slugs).to include("warszawa")
    expect(slugs).not_to include("wroclaw")
  end

  it "normalizes Polish diacritics in the query" do
    body_ascii = search("lodz").pluck("slug")
    body_diacritics = search("łódź").pluck("slug")
    expect(body_ascii).to include("lodz")
    expect(body_diacritics).to include("lodz")
  end

  it "orders results by population_hint descending with nulls last" do
    body = search("w").pluck("slug")
    expect(body.first).to eq("warszawa")
    expect(body.last).to eq("everywhere")
  end

  it "limits results to ten" do
    15.times { |i| create(:city, name: "Wtest#{i}", population_hint: 100_000 - i) }
    body = search("wtest")
    expect(body.size).to eq(10)
  end

  it "returns an empty array for a blank query" do
    expect(search("")).to eq([])
  end

  it "exposes the special everywhere record when its name is queried" do
    body = search("wsz")
    expect(body.pluck("slug")).to include("everywhere")
    expect(body.find { |c| c["slug"] == "everywhere" }["is_special"]).to be(true)
  end
end

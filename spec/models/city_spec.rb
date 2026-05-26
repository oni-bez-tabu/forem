require "rails_helper"

RSpec.describe City do
  describe "validations" do
    it "requires name" do
      city = build(:city, name: nil)
      expect(city).not_to be_valid
      expect(city.errors[:name]).to be_present
    end

    it "requires unique slug" do
      create(:city, name: "Warszawa")
      duplicate = build(:city, name: "Warszawa")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors.details[:slug].pluck(:error)).to include(:taken)
    end
  end

  describe "callbacks" do
    it "auto-generates slug from name on create" do
      city = create(:city, name: "Łódź")
      expect(city.slug).to eq("lodz")
    end

    it "auto-fills name_normalized stripping Polish diacritics and lowercasing" do
      city = create(:city, name: "Świnoujście")
      expect(city.name_normalized).to eq("swinoujscie")
    end

    it "honors explicitly provided slug" do
      city = create(:city, name: "Warszawa", slug: "warsaw-special")
      expect(city.slug).to eq("warsaw-special")
    end
  end

  describe ".normalize" do
    it "strips Polish diacritics, lowercases and trims whitespace" do
      expect(described_class.normalize("  Łódź  ")).to eq("lodz")
    end

    it "returns an empty string for blank input" do
      expect(described_class.normalize(nil)).to eq("")
      expect(described_class.normalize("")).to eq("")
    end
  end

  describe ".search_by_name" do
    let!(:warsaw)   { create(:city, name: "Warszawa", population_hint: 1_700_000) }
    let!(:wroclaw)  { create(:city, name: "Wrocław",  population_hint: 640_000) }
    let!(:lodz)     { create(:city, name: "Łódź",     population_hint: 680_000) }
    let!(:everywhere) { create(:city, name: "🌍 Wszędzie", slug: "everywhere", is_special: true, population_hint: nil) }

    it "matches names starting with the query (prefix match)" do
      results = described_class.search_by_name("war")
      expect(results).to include(warsaw)
      expect(results).not_to include(wroclaw)
    end

    it "normalizes Polish diacritics in the query" do
      expect(described_class.search_by_name("lodz")).to include(lodz)
      expect(described_class.search_by_name("łódź")).to include(lodz)
    end

    it "orders by population_hint descending with nulls last" do
      results = described_class.search_by_name("w").to_a
      expect(results.first).to eq(warsaw)
      expect(results.last).to eq(everywhere)
    end

    it "returns an empty relation for blank queries" do
      expect(described_class.search_by_name("")).to be_empty
      expect(described_class.search_by_name(nil)).to be_empty
    end

    it "is case-insensitive" do
      expect(described_class.search_by_name("WAR")).to include(warsaw)
    end
  end
end

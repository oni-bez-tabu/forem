require "rails_helper"

RSpec.describe Meetups::CitiesSeeder do
  describe ".call" do
    # Geonames TSV columns 0..18 — only feature_class(6), feature_code(7), admin1_code(10),
    # population(14), name(1) really matter for our import; rest is filler.
    def geonames_row(geonameid:, name:, feature_class: "P", feature_code: "PPL",
                     admin1_code: "78", population: 100_000)
      cols = Array.new(19, "")
      cols[0]  = geonameid.to_s
      cols[1]  = name
      cols[2]  = name
      cols[6]  = feature_class
      cols[7]  = feature_code
      cols[10] = admin1_code
      cols[14] = population.to_s
      cols.join("\t")
    end

    let(:tsv) do
      [
        # Warsaw is Geonames' English name — seeder must override to Polish "Warszawa".
        geonames_row(geonameid: 1, name: "Warsaw", admin1_code: "78", population: 1_700_000),
        geonames_row(geonameid: 2, name: "Łódź", admin1_code: "74", population: 680_000),
        geonames_row(geonameid: 3, name: "Smallville", admin1_code: "78", population: 1_200), # too small
        geonames_row(geonameid: 4, name: "Bigmountain", feature_class: "T", population: 50_000) # wrong feature_class
      ].join("\n")
    end

    let(:io) { StringIO.new(tsv) }

    it "inserts the special 'everywhere' record" do
      described_class.call(io: io)
      everywhere = City.find_by(slug: "everywhere")
      expect(everywhere).to be_present
      expect(everywhere.is_special).to be(true)
      expect(everywhere.name).to eq("🌍 Wszędzie")
    end

    it "imports only populated places with population >= 5000" do
      described_class.call(io: io)
      expect(City.where(is_special: false).pluck(:slug)).to match_array(%w[warszawa lodz])
    end

    it "applies NAME_OVERRIDES before slug generation" do
      described_class.call(io: io)
      expect(City.find_by(slug: "warszawa").name).to eq("Warszawa")
    end

    it "assigns voivodeship from admin1_code mapping" do
      described_class.call(io: io)
      expect(City.find_by(slug: "warszawa").voivodeship).to eq("Mazowieckie")
      expect(City.find_by(slug: "lodz").voivodeship).to eq("Łódzkie")
    end

    it "normalizes names for prefix search" do
      described_class.call(io: io)
      expect(City.find_by(slug: "lodz").name_normalized).to eq("lodz")
    end

    it "is idempotent on rerun" do
      described_class.call(io: StringIO.new(tsv))
      expect { described_class.call(io: StringIO.new(tsv)) }.not_to change(City, :count)
    end

    it "reports imported and skipped counts" do
      result = described_class.call(io: io)
      expect(result.imported).to eq(2)
      expect(result.skipped).to eq(2)
    end
  end
end

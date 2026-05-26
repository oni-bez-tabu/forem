require "open-uri"
require "zip"

module Meetups
  class CitiesSeeder
    GEONAMES_URL = "https://download.geonames.org/export/dump/PL.zip".freeze
    ENTRY_NAME = "PL.txt".freeze
    POPULATION_THRESHOLD = 5_000

    SPECIAL_CITY = {
      name: "🌍 Wszędzie",
      slug: "everywhere",
      name_normalized: "wszedzie",
      is_special: true,
      population_hint: nil,
      voivodeship: nil
    }.freeze

    # Geonames admin1_code → voivodeship name. Codes that aren't mapped fall back to nil.
    # Source: https://download.geonames.org/export/dump/admin1CodesASCII.txt (PL.*).
    VOIVODESHIP_MAP = {
      "72" => "Dolnośląskie",
      "73" => "Kujawsko-Pomorskie",
      "74" => "Łódzkie",
      "75" => "Lubelskie",
      "76" => "Lubuskie",
      "77" => "Małopolskie",
      "78" => "Mazowieckie",
      "79" => "Opolskie",
      "80" => "Podkarpackie",
      "81" => "Podlaskie",
      "82" => "Pomorskie",
      "83" => "Śląskie",
      "84" => "Świętokrzyskie",
      "85" => "Warmińsko-Mazurskie",
      "86" => "Wielkopolskie",
      "87" => "Zachodniopomorskie"
    }.freeze

    # Geonames prefers English names for a few major Polish cities. Map them back to native.
    NAME_OVERRIDES = {
      "Warsaw" => "Warszawa"
    }.freeze

    Result = Struct.new(:imported, :skipped, keyword_init: true)

    def self.call(...)
      new(...).call
    end

    def initialize(io: nil, logger: Rails.logger)
      @io = io
      @logger = logger
    end

    def call
      ensure_special_record

      imported = 0
      skipped = 0
      seen_slugs = Set.new

      io = @io || download_and_extract
      io.each_line do |line|
        row = parse_row(line)
        unless eligible?(row)
          skipped += 1
          next
        end

        slug = ActiveSupport::Inflector.parameterize(row[:name])
        if slug.blank? || seen_slugs.include?(slug)
          skipped += 1
          next
        end

        seen_slugs << slug
        upsert_city(row, slug)
        imported += 1
      end

      @logger.info("Meetups::CitiesSeeder: imported #{imported}, skipped #{skipped}")
      Result.new(imported: imported, skipped: skipped)
    ensure
      io.close if io.respond_to?(:close) && @io.nil?
    end

    private

    def ensure_special_record
      now = Time.current
      City.upsert(
        SPECIAL_CITY.merge(created_at: now, updated_at: now),
        unique_by: :slug
      )
    end

    def parse_row(line)
      cols = line.split("\t")
      raw_name = cols[1].to_s.strip
      {
        geonameid: cols[0],
        name: NAME_OVERRIDES.fetch(raw_name, raw_name),
        feature_class: cols[6],
        feature_code: cols[7],
        admin1_code: cols[10],
        population: cols[14].to_i
      }
    end

    def eligible?(row)
      row[:feature_class] == "P" &&
        row[:name].present? &&
        row[:population] >= POPULATION_THRESHOLD
    end

    def upsert_city(row, slug)
      now = Time.current
      City.upsert(
        {
          name: row[:name],
          slug: slug,
          name_normalized: City.normalize(row[:name]),
          voivodeship: VOIVODESHIP_MAP[row[:admin1_code]],
          is_special: false,
          population_hint: row[:population],
          created_at: now,
          updated_at: now
        },
        unique_by: :slug
      )
    end

    def download_and_extract
      @logger.info("Meetups::CitiesSeeder: downloading #{GEONAMES_URL}")
      buffer = URI.parse(GEONAMES_URL).open { |f| f.read }
      payload = nil
      Zip::File.open_buffer(buffer) do |zip|
        entry = zip.find_entry(ENTRY_NAME)
        raise "#{ENTRY_NAME} not found inside Geonames archive" unless entry

        payload = entry.get_input_stream.read.force_encoding("UTF-8")
      end
      StringIO.new(payload)
    end
  end
end

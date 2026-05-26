class City < ApplicationRecord
  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :name_normalized, presence: true

  before_validation :assign_slug_from_name, on: :create
  before_validation :assign_name_normalized

  scope :search_by_name, lambda { |query|
    normalized = normalize(query)
    return none if normalized.blank?

    sanitized = sanitize_sql_like(normalized)
    where("name_normalized ILIKE ?", "#{sanitized}%")
      .order(Arel.sql("population_hint DESC NULLS LAST, name ASC"))
  }

  # Strip Polish diacritics + lowercase + drop non-alphanumerics (emoji, punctuation)
  # so ILIKE prefix matches work on names like "🌍 Wszędzie" or "Świnoujście".
  def self.normalize(str)
    return "" if str.blank?

    ActiveSupport::Inflector.transliterate(str.to_s)
      .downcase
      .gsub(/[^a-z0-9 ]+/, " ")
      .squish
  end

  private

  def assign_slug_from_name
    return if slug.present? || name.blank?

    self.slug = ActiveSupport::Inflector.parameterize(name)
  end

  def assign_name_normalized
    self.name_normalized = self.class.normalize(name) if name.present?
  end
end

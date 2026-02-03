class Listing < ApplicationRecord
  self.table_name = "classified_listings"

  def self.feature_enabled?
    FeatureFlag.enabled?(:listing_feature)
  end
end
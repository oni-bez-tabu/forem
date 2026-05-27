class MatchingRecommendationImpression < ApplicationRecord
  RECENCY_WINDOW = 7.days
  WEEKLY_CAP = 2

  belongs_to :user
  belongs_to :meetup

  validates :shown_at, presence: true

  scope :recent_for, lambda { |user|
    where(user_id: user.id).where("shown_at > ?", RECENCY_WINDOW.ago)
  }
end

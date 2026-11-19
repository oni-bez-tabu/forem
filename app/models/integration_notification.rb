# A notification sent to a user by an external integration (e.g. Strefa Pary).
# It is the notifiable of a Notification, so it shows up in the bell like other notifications.
class IntegrationNotification < ApplicationRecord
  belongs_to :user
  has_many :notifications, as: :notifiable, inverse_of: :notifiable, dependent: :destroy

  validates :scope, :title, :category, presence: true
  validates :title, length: { maximum: 120 }
  validates :body, length: { maximum: 500 }, allow_nil: true
  validates :url, length: { maximum: 500 }, allow_nil: true
end

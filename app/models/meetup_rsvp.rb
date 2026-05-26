class MeetupRsvp < ApplicationRecord
  STATUSES = %w[going interested].freeze

  belongs_to :meetup
  belongs_to :user

  validates :status, inclusion: { in: STATUSES }
  validates :user_id, uniqueness: { scope: :meetup_id }

  counter_culture :meetup,
                  column_name: proc { |rsvp| "#{rsvp.status}_count" },
                  column_names: {
                    ["meetup_rsvps.status = ?", "going"] => "going_count",
                    ["meetup_rsvps.status = ?", "interested"] => "interested_count"
                  }
end

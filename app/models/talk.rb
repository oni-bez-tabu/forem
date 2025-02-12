class Talk < ApplicationRecord
  belongs_to :user

  enum status: {
    created: 0,
    scheduled: 1,
    started: 2,
    finished: 3,
    banned: 4,
    removed: 5
  }, _default: 0

  validates :title, presence: true
  validates :start_date, presence: true
  validates :channel_id, presence: true
  validates :host_id, presence: true
  validates :viewer_id, presence: true
  validates :video, inclusion: { in: [true, false] }
  
  validate :start_date_not_in_past, on: :create

  def scheduled_channel_id(current_user = nil)
    return nil unless current_user
    return nil unless user_id == current_user.id
    return nil if start_date > Time.current + 5.minutes
    
    channel_id
  end

  def can_be_finished?
    created? || started?
  end

  def can_be_banned?
    started?
  end

  def can_be_removed?
    created? || started? || finished?
  end

  private

  def start_date_not_in_past
    return if start_date.blank?

    if start_date < Time.current - 1.minute
      errors.add(:start_date, "nie może być z przeszłości")
    end
  end
end 
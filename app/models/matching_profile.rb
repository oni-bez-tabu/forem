class MatchingProfile < ApplicationRecord
  IDENTITY_TYPES = %w[woman man couple non_binary].freeze
  MODERATION_STATES = %w[pending approved rejected].freeze
  BIO_MAX_LENGTH = 200
  # Editing any of these fields after approval/rejection sends the profile back to pending.
  CONTENT_FIELDS = %w[photo identity_type city_id bio].freeze

  mount_uploader :photo, MatchingProfilePhotoUploader

  belongs_to :user
  belongs_to :city

  has_many :matching_declarations, class_name: "MeetupMatchingDeclaration", dependent: :destroy

  validates :photo, presence: true
  validates :identity_type, inclusion: { in: IDENTITY_TYPES }
  validates :moderation_state, inclusion: { in: MODERATION_STATES }
  validates :bio, length: { maximum: BIO_MAX_LENGTH }
  validates :user_id, uniqueness: true

  before_save :reset_moderation_on_content_change
  after_commit :send_moderation_email, on: :update

  scope :active, -> { where(is_active: true) }
  scope :approved, -> { where(moderation_state: "approved") }
  scope :pending_review, -> { where(moderation_state: "pending") }
  scope :rejected, -> { where(moderation_state: "rejected") }
  scope :visible_to_others, -> { active.approved }

  def approved?
    moderation_state == "approved"
  end

  def pending?
    moderation_state == "pending"
  end

  def rejected?
    moderation_state == "rejected"
  end

  def visible_to_others?
    is_active? && approved?
  end

  def approve!
    update!(moderation_state: "approved", moderation_reason: nil)
  end

  def reject!(reason: nil)
    update!(moderation_state: "rejected", moderation_reason: reason)
  end

  def deactivate!
    update!(is_active: false)
  end

  def reactivate!
    update!(is_active: true)
  end

  private

  def reset_moderation_on_content_change
    return unless persisted?
    return if moderation_state == "pending"

    touched = changed & CONTENT_FIELDS
    return if touched.empty?

    self.moderation_state = "pending"
    self.moderation_reason = nil
  end

  def send_moderation_email
    return unless saved_change_to_moderation_state?

    case moderation_state
    when "approved" then MatchingMailer.with(profile: self).approved.deliver_later
    when "rejected" then MatchingMailer.with(profile: self).rejected.deliver_later
    end
  end
end

class MeetupMatchingDeclaration < ApplicationRecord
  INTENT_LEVELS = %w[not_looking just_vibe open_to_meet].freeze
  ACTIVE_INTENTS = %w[just_vibe open_to_meet].freeze
  NOTE_MAX_LENGTH = 200

  belongs_to :meetup
  belongs_to :matching_profile

  validates :intent_level, inclusion: { in: INTENT_LEVELS }
  validates :meetup_note, length: { maximum: NOTE_MAX_LENGTH }
  validates :matching_profile_id, uniqueness: { scope: :meetup_id }
  validate :rsvp_exists_for_profile

  scope :active_intents, -> { where(intent_level: ACTIVE_INTENTS) }
  scope :for_meetup, ->(meetup) { where(meetup_id: meetup.id) }

  delegate :user, :user_id, :identity_type, to: :matching_profile

  def intent_active?
    ACTIVE_INTENTS.include?(intent_level)
  end

  def not_looking?
    intent_level == "not_looking"
  end

  private

  def rsvp_exists_for_profile
    return if meetup_id.blank? || matching_profile.nil?
    return if MeetupRsvp.exists?(meetup_id: meetup_id, user_id: matching_profile.user_id)

    errors.add(:base, "declaration requires an existing RSVP on this meetup")
  end
end

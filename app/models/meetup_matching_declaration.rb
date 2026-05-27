class MeetupMatchingDeclaration < ApplicationRecord
  INTENT_LEVELS = %w[not_looking just_vibe open_to_meet].freeze
  ACTIVE_INTENTS = %w[just_vibe open_to_meet].freeze
  NOTE_MAX_LENGTH = 200

  belongs_to :meetup
  belongs_to :matching_profile

  validates :intent_level, inclusion: { in: INTENT_LEVELS }
  validates :meetup_note, length: { maximum: NOTE_MAX_LENGTH }
  validates :matching_profile_id, uniqueness: { scope: :meetup_id }
  validate :looking_for_subset_of_identities
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

  # Per R3 — just_vibe with empty looking_for is treated as "everyone".
  def effective_looking_for
    raw = Array(looking_for).compact_blank
    return MatchingProfile::IDENTITY_TYPES if intent_level == "just_vibe" && raw.empty?

    raw
  end

  private

  def looking_for_subset_of_identities
    invalid = Array(looking_for) - MatchingProfile::IDENTITY_TYPES
    return if invalid.empty?

    errors.add(:looking_for, "contains invalid identity types: #{invalid.join(', ')}")
  end

  def rsvp_exists_for_profile
    return if meetup_id.blank? || matching_profile.nil?
    return if MeetupRsvp.exists?(meetup_id: meetup_id, user_id: matching_profile.user_id)

    errors.add(:base, "declaration requires an existing RSVP on this meetup")
  end
end

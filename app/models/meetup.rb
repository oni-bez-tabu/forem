class Meetup < ApplicationRecord
  LIST_LIFECYCLE_GRACE = 24.hours
  BANNER_GRADIENTS = %w[dusk velvet ember night olive sunrise].freeze
  DESCRIPTION_LINK_TYPES = %w[internal external].freeze

  mount_uploader :banner, MeetupBannerUploader

  belongs_to :organizer_user, class_name: "User", optional: true
  belongs_to :organizer_organization, class_name: "Organization", optional: true
  belongs_to :venue_city, class_name: "City"
  belongs_to :description_internal_post, class_name: "Article", optional: true
  belongs_to :created_by, class_name: "User"

  has_many :rsvps, class_name: "MeetupRsvp", dependent: :destroy
  has_many :going_rsvps, -> { where(status: "going") }, class_name: "MeetupRsvp"
  has_many :interested_rsvps, -> { where(status: "interested") }, class_name: "MeetupRsvp"
  has_many :matching_declarations, class_name: "MeetupMatchingDeclaration", dependent: :destroy

  validates :name, presence: true, length: { maximum: 200 }
  validates :slug, presence: true, uniqueness: true, format: { with: /\A[a-z0-9-]+\z/ }
  validates :venue_name, presence: true
  validates :start_at, :end_at, presence: true
  validates :banner_gradient, inclusion: { in: BANNER_GRADIENTS }
  validates :description_link_type, inclusion: { in: DESCRIPTION_LINK_TYPES }
  validates :description_external_url, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]) }, allow_blank: true

  validate :end_after_start
  validate :exactly_one_organizer
  validate :description_link_xor

  before_validation :assign_slug, on: :create

  scope :published, -> { where(is_published: true) }
  scope :visible_in_lists, lambda {
    published.where("end_at > ?", LIST_LIFECYCLE_GRACE.ago)
  }
  scope :upcoming_first, -> { order(start_at: :asc) }

  def to_param
    slug
  end

  def organizer
    organizer_user || organizer_organization
  end

  def expired_for_lists?
    end_at <= LIST_LIFECYCLE_GRACE.ago
  end

  private

  def assign_slug
    return if slug.present? || name.blank? || start_at.blank?

    base = ActiveSupport::Inflector.parameterize(name)
    date_suffix = start_at.to_date.iso8601
    self.slug = "#{base}-#{date_suffix}"
  end

  def end_after_start
    return if start_at.blank? || end_at.blank?

    errors.add(:end_at, "must be after start_at") if end_at <= start_at
  end

  def exactly_one_organizer
    # Use association presence, not *_id — factories build unsaved users where the FK is still nil.
    has_user = organizer_user.present? || organizer_user_id.present?
    has_org = organizer_organization.present? || organizer_organization_id.present?
    return if has_user ^ has_org

    errors.add(:base, "exactly one of organizer_user or organizer_organization must be set")
  end

  def description_link_xor
    case description_link_type
    when "internal"
      errors.add(:description_internal_post_id, "is required for internal description") if description_internal_post_id.blank?
      errors.add(:description_external_url, "must be blank for internal description") if description_external_url.present?
    when "external"
      errors.add(:description_external_url, "is required for external description") if description_external_url.blank?
      errors.add(:description_internal_post_id, "must be blank for external description") if description_internal_post_id.present?
    end
  end
end

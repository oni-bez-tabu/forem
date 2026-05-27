class MatchingWelcome < ApplicationRecord
  # Treść uniwersalna — kobieta/mężczyzna/para/non_binary, brak personalizacji.
  # URL profilu event-scoped sendera, działa do `meetup.end_at + 48h`.
  TEMPLATE = <<~MSG.freeze
    Hej, planujemy wybrać się na to samo wydarzenie, może warto pogadać wcześniej?

    Mój profil Matching: %<profile_url>s
  MSG

  belongs_to :sender_profile, class_name: "MatchingProfile"
  belongs_to :receiver_profile, class_name: "MatchingProfile"
  belongs_to :meetup

  validates :sent_at, presence: true
  # Per-person uniqueness — controller layer rejects duplicates with 409 before save;
  # this validation is a belt-and-braces guard backed by the DB unique index.
  validates :sender_profile_id, uniqueness: { scope: :receiver_profile_id }
  validate :sender_and_receiver_distinct

  scope :for_meetup, ->(meetup) { where(meetup_id: meetup.id) }

  def self.exists_between?(sender_profile, receiver_profile)
    exists?(sender_profile_id: sender_profile.id, receiver_profile_id: receiver_profile.id)
  end

  def self.render_body(sender_profile:, meetup:, host:)
    profile_url = "https://#{host}/m/#{meetup.slug}/#{sender_profile.id}"
    format(TEMPLATE, profile_url: profile_url)
  end

  private

  def sender_and_receiver_distinct
    return if sender_profile_id.blank? || receiver_profile_id.blank?

    errors.add(:receiver_profile_id, "cannot equal sender") if sender_profile_id == receiver_profile_id
  end
end

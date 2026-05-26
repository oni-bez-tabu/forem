module MeetupsHelper
  # Placeholder palette — replace with hifi-mockup values once we wire the
  # design tokens in Etap 2/3. Each entry produces a CSS background style for
  # the meetup hero banner when no uploaded image is present.
  BANNER_GRADIENTS = {
    "dusk"    => "linear-gradient(135deg, #4a0e4e 0%, #81267d 100%)",
    "velvet"  => "linear-gradient(135deg, #6b0f1a 0%, #d4351c 100%)",
    "ember"   => "linear-gradient(135deg, #c2410c 0%, #f59e0b 100%)",
    "night"   => "linear-gradient(135deg, #0c1e3a 0%, #1e3a8a 100%)",
    "olive"   => "linear-gradient(135deg, #365314 0%, #84cc16 100%)",
    "sunrise" => "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
  }.freeze

  def meetup_banner_style(meetup)
    return "background-image: url(#{meetup.banner.url});" if meetup.banner.present?

    gradient = BANNER_GRADIENTS[meetup.banner_gradient] || BANNER_GRADIENTS.fetch("dusk")
    "background-image: #{gradient};"
  end

  def meetup_organizer_label(meetup)
    organizer = meetup.organizer
    return I18n.t("meetups.unknown_organizer") unless organizer

    organizer.respond_to?(:name) ? organizer.name.presence || organizer.try(:username) : organizer.to_s
  end

  def meetup_day_header(meetup)
    I18n.l(meetup.start_at.to_date, format: :long)
  end
end

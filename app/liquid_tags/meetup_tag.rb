class MeetupTag < LiquidTagBase
  PARTIAL = "meetups/liquid".freeze
  # Matches both bare slugs (`{% meetup my-slug %}`) and full local URLs
  # (`{% embed https://host/meetups/my-slug %}`). Local URL matching is the
  # contract for UnifiedEmbed::Registry.
  SLUG_PATTERN = /\A[a-z0-9-]+\z/
  REGISTRY_REGEXP = %r{https?://[^/\s]+/meetups/(?<slug>[a-z0-9-]+)/?\z}

  def initialize(_tag_name, input, _parse_context)
    super
    slug = extract_slug(input.to_s.strip)
    raise StandardError, I18n.t("liquid_tags.meetup_tag.invalid_slug") if slug.nil?

    @meetup = Meetup.find_by(slug: slug)
    raise StandardError, I18n.t("liquid_tags.meetup_tag.not_found") if @meetup.nil?
  end

  def render(_context)
    ApplicationController.render(
      partial: PARTIAL,
      locals: {
        meetup: @meetup,
        widget_state: widget_state
      },
    )
  end

  private

  def extract_slug(input)
    match = input.match(REGISTRY_REGEXP)
    return match[:slug] if match

    input if input.match?(SLUG_PATTERN)
  end

  def widget_state
    now = Time.current
    return :expired if @meetup.end_at + Meetup::LIST_LIFECYCLE_GRACE <= now
    return :active if @meetup.start_at <= now && now <= @meetup.end_at + Meetup::LIST_LIFECYCLE_GRACE

    :upcoming
  end
end

Liquid::Template.register_tag("meetup", MeetupTag)

# Insert at the FRONT of UnifiedEmbed registry, not the back. ForemTag has a
# catch-all regex matching any local URL and would otherwise win `@registry.detect`,
# triggering a HEAD validation that fails for `localhost` URLs (and even on
# prod swallows our specific routing).
#
# skip_validation: true — local URL, no HEAD round-trip needed; MeetupTag's
# own DB lookup is the source of truth.
#
# Dedupe by class name (not by `==`) — Rails dev autoreload re-runs this file
# and the new MeetupTag constant won't match old captured entries.
registry = UnifiedEmbed::Registry.instance.instance_variable_get(:@registry)
registry.reject! { |h| h[:klass].name == "MeetupTag" }
registry.unshift(regexp: MeetupTag::REGISTRY_REGEXP, klass: MeetupTag, skip_validation: true)

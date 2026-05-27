class MeetupTag < LiquidTagBase
  PARTIAL = "meetups/liquid".freeze
  SLUG_PATTERN = /\A[a-z0-9-]+\z/

  def initialize(_tag_name, input, parse_context)
    super
    slug = input.to_s.strip
    raise StandardError, I18n.t("liquid_tags.meetup_tag.invalid_slug") unless slug.match?(SLUG_PATTERN)

    @meetup = Meetup.find_by(slug: slug)
    raise StandardError, I18n.t("liquid_tags.meetup_tag.not_found") if @meetup.nil?

    @author = parse_context.partial_options[:user]
  end

  def render(_context)
    ApplicationController.render(
      partial: PARTIAL,
      locals: {
        meetup: @meetup,
        widget_state: widget_state,
        author_rsvp_status: author_rsvp_status
      },
    )
  end

  private

  def widget_state
    now = Time.current
    return :expired if @meetup.end_at + Meetup::LIST_LIFECYCLE_GRACE <= now
    return :active if @meetup.start_at <= now && now <= @meetup.end_at + Meetup::LIST_LIFECYCLE_GRACE

    :upcoming
  end

  def author_rsvp_status
    return unless @author

    MeetupRsvp.find_by(meetup_id: @meetup.id, user_id: @author.id)&.status
  end
end

Liquid::Template.register_tag("meetup", MeetupTag)

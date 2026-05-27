module MatchingHelper
  # Dot color class + hex for the E8 timeline dots, keyed by event type from
  # Matching::TimelineFeed. Mirrors the hifi mockup palette.
  TIMELINE_DOT_HEX = {
    match_found:         "#171717",
    declaration_created: "#a91f69",
    declaration_updated: "#a91f69",
    welcome_sent:        "#6366f1",
    welcome_received:    "#6366f1",
    needs_intent:        "#d97706",
    rsvp_created:        "#9ca3af",
  }.freeze

  def dot_hex_for(event_type)
    TIMELINE_DOT_HEX[event_type] || "#9ca3af"
  end

  def dot_color_for(event_type)
    case event_type
    when :match_found then "dark"
    when :declaration_created, :declaration_updated then "magenta"
    when :welcome_sent, :welcome_received then "brand"
    when :needs_intent then "warning"
    else "grey"
    end
  end
end

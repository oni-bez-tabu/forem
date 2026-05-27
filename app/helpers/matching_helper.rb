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

  # Inline pill styles — `crayons-indicator` in this Forem build ships
  # without a border-radius / background, so we render pills via inline
  # styles to guarantee the mockup shape.
  def pill_style(variant)
    base = "display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; white-space: nowrap;"
    case variant
    when :solid
      "#{base} background: var(--base-90, #171717); color: #fff;"
    when :brand
      "#{base} background: var(--accent-brand, #6366f1); color: #fff;"
    when :brand_soft
      "#{base} background: var(--accent-brand-lighter, #ede9fe); color: var(--accent-brand, #6366f1);"
    when :magenta
      "#{base} background: rgba(169,31,105,0.12); color: rgb(169,31,105);"
    when :success
      "#{base} background: rgba(5,150,105,0.12); color: rgb(5,150,105);"
    when :warning
      "#{base} background: rgba(217,119,6,0.12); color: rgb(217,119,6);"
    when :danger
      "#{base} background: rgba(220,38,38,0.12); color: rgb(220,38,38);"
    else # :outline
      "#{base} background: transparent; border: 1px solid var(--card-border, #e5e5e5); color: var(--base-90, #171717); font-weight: 500;"
    end
  end
end

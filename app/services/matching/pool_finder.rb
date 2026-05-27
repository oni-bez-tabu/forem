module Matching
  # Applies SPEC.md §6 visibility rules R1–R6 to compute the list of other
  # users a viewer should see on a given meetup, grouped by intent match.
  #
  # Usage:
  #   finder = Matching::PoolFinder.new(viewer_profile: profile, meetup: meetup)
  #   finder.viewer_visible?          # R4 — only active intents see anything
  #   finder.same_intent_group        # Group 1
  #   finder.other_intent_group       # Group 2
  class PoolFinder
    def initialize(viewer_profile:, meetup:)
      @viewer = viewer_profile
      @meetup = meetup
    end

    # The viewer's own declaration on this meetup (if any).
    def viewer_declaration
      @viewer_declaration ||= begin
        return nil unless @viewer
        MeetupMatchingDeclaration.find_by(meetup_id: @meetup.id, matching_profile_id: @viewer.id)
      end
    end

    # R4 — not_looking and missing declaration block the viewer from seeing
    # the list. Viewer also needs an active, approved profile to participate.
    def viewer_visible?
      return false unless @viewer&.visible_to_others?
      return false unless viewer_declaration
      return false unless viewer_declaration.intent_active?

      true
    end

    def compatible_declarations
      return [] unless viewer_visible?

      base_pool.to_a.select { |dec| compatible_with_viewer?(dec) }
    end

    def same_intent_group
      compatible_declarations.select { |d| d.intent_level == viewer_declaration.intent_level }
    end

    def other_intent_group
      compatible_declarations.reject { |d| d.intent_level == viewer_declaration.intent_level }
    end

    def total_count
      compatible_declarations.size
    end

    private

    def base_pool
      MeetupMatchingDeclaration
        .joins(:matching_profile)
        .where(meetup_id: @meetup.id)
        .where.not(matching_profile_id: @viewer.id)
        .active_intents
        .where(matching_profiles: { is_active: true, moderation_state: "approved" })
        .includes(matching_profile: :city)
    end

    # Product decision (session #2): identity filtering disabled — anyone with
    # an active declaration sees anyone else with an active declaration on the
    # same meetup. Compatibility now boils down to "both have active intents",
    # which is already enforced by `base_pool`'s `active_intents` scope.
    def compatible_with_viewer?(_dec)
      true
    end
  end
end

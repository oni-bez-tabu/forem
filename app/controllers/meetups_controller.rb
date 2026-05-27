class MeetupsController < ApplicationController
  PAGE_SIZE = 20

  def index
    base = Meetup.visible_in_lists
      .upcoming_first
      .includes(:venue_city, :organizer_user, :organizer_organization)

    @page_offset = params[:offset].to_i.clamp(0, 10_000)
    @meetups = base.limit(PAGE_SIZE).offset(@page_offset)
    @next_offset = @page_offset + @meetups.length
    @has_more = base.limit(1).offset(@next_offset).any?

    if current_user
      @current_profile = MatchingProfile.find_by(user_id: current_user.id)
      @rsvp_status_by_meetup = MeetupRsvp
        .where(user_id: current_user.id, meetup_id: @meetups.map(&:id))
        .pluck(:meetup_id, :status)
        .to_h
    else
      @rsvp_status_by_meetup = {}
    end

    @match_pool_by_meetup = MeetupMatchingDeclaration
      .where(meetup_id: @meetups.map(&:id))
      .where(intent_level: MeetupMatchingDeclaration::ACTIVE_INTENTS)
      .joins(:matching_profile)
      .where(matching_profile: { is_active: true, moderation_state: "approved" })
      .group(:meetup_id)
      .count
  end

  def show
    @meetup = Meetup.visible_in_lists.find_by(slug: params[:slug])
    raise ActiveRecord::RecordNotFound unless @meetup

    @current_rsvp = current_user && MeetupRsvp.find_by(meetup: @meetup, user: current_user)
    @current_profile = current_user && MatchingProfile.find_by(user_id: current_user.id)
    @current_declaration = if @current_profile
                             MeetupMatchingDeclaration.find_by(meetup: @meetup, matching_profile: @current_profile)
                           end
    @pool = Matching::PoolFinder.new(viewer_profile: @current_profile, meetup: @meetup) if @current_profile

    # E10 declaration popup (modal over the hub). Triggered by `?declare=1` —
    # populated after RSVP redirects here or when P3 clicks "Zmień deklarację".
    @show_declaration_modal = params[:declare] == "1" && @current_profile&.visible_to_others?
    if @show_declaration_modal
      @declaration_for_modal = @current_declaration || MeetupMatchingDeclaration.new(
        meetup: @meetup,
        matching_profile: @current_profile,
        intent_level: "open_to_meet",
      )
    end
  end
end

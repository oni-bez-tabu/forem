class MeetupsController < ApplicationController
  def index
    @meetups = Meetup.visible_in_lists
      .upcoming_first
      .includes(:venue_city, :organizer_user, :organizer_organization)
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
  end
end

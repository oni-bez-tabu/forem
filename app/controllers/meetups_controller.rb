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
  end
end

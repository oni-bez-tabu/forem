module Meetups
  class RsvpsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_meetup

    def create
      rsvp = MeetupRsvp.find_or_initialize_by(meetup: @meetup, user: current_user)
      new_status = params.dig(:meetup_rsvp, :status) || params[:status]

      if rsvp.persisted? && rsvp.status == new_status
        rsvp.destroy
        redirect_to meetup_path(@meetup), notice: I18n.t("meetups.rsvp.removed")
        return
      end

      rsvp.status = new_status
      if rsvp.save
        notice_key = new_status == "going" ? "meetups.rsvp.saved_going" : "meetups.rsvp.saved_interested"
        redirect_to meetup_path(@meetup), notice: I18n.t(notice_key)
      else
        redirect_to meetup_path(@meetup), alert: rsvp.errors.full_messages.to_sentence
      end
    end

    def destroy
      MeetupRsvp.where(meetup: @meetup, user: current_user).destroy_all
      redirect_to meetup_path(@meetup), notice: I18n.t("meetups.rsvp.removed")
    end

    private

    def set_meetup
      @meetup = Meetup.visible_in_lists.find_by(slug: params[:meetup_slug])
      raise ActiveRecord::RecordNotFound unless @meetup
    end
  end
end

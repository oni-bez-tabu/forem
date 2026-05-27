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
        if needs_declaration_prompt?
          redirect_to meetup_path(@meetup, declare: 1),
                      notice: I18n.t("meetups.rsvp.prompt_for_declaration")
        else
          redirect_to meetup_path(@meetup), notice: I18n.t(notice_key)
        end
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

    # SPEC §5 Flow C.2 — if the user has an active matching profile but no
    # declaration on this meetup yet, send them straight to the intent popup.
    def needs_declaration_prompt?
      profile = MatchingProfile.find_by(user_id: current_user.id)
      return false unless profile&.visible_to_others?
      return false if MeetupMatchingDeclaration.exists?(meetup_id: @meetup.id, matching_profile_id: profile.id)

      true
    end
  end
end

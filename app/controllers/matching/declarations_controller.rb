module Matching
  class DeclarationsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_meetup
    before_action :load_current_profile
    before_action :require_active_profile
    before_action :require_rsvp
    before_action :set_declaration, only: %i[edit update destroy]

    def new
      @declaration = MeetupMatchingDeclaration.new(
        meetup: @meetup,
        matching_profile: @current_profile,
        intent_level: "open_to_meet"
      )
      render :form
    end

    def create
      @declaration = MeetupMatchingDeclaration.new(declaration_params.merge(
                                                     meetup: @meetup,
                                                     matching_profile: @current_profile,
                                                   ))
      if @declaration.save
        redirect_to meetup_path(@meetup), notice: I18n.t("matching.declarations.saved")
      else
        render :form, status: :unprocessable_entity
      end
    end

    def edit
      render :form
    end

    def update
      if @declaration.update(declaration_params)
        redirect_to meetup_path(@meetup), notice: I18n.t("matching.declarations.saved")
      else
        render :form, status: :unprocessable_entity
      end
    end

    def destroy
      @declaration.destroy
      redirect_to meetup_path(@meetup), notice: I18n.t("matching.declarations.deleted")
    end

    private

    def set_meetup
      @meetup = Meetup.visible_in_lists.find_by(slug: params[:meetup_slug])
      raise ActiveRecord::RecordNotFound unless @meetup
    end

    def load_current_profile
      @current_profile = MatchingProfile.find_by(user_id: current_user.id)
    end

    def require_active_profile
      return if @current_profile&.visible_to_others?

      redirect_to matching_path, alert: I18n.t("matching.declarations.profile_required")
    end

    def require_rsvp
      return if MeetupRsvp.exists?(meetup_id: @meetup.id, user_id: current_user.id)

      redirect_to meetup_path(@meetup), alert: I18n.t("matching.declarations.rsvp_required")
    end

    def set_declaration
      @declaration = MeetupMatchingDeclaration.find_by(meetup: @meetup, matching_profile: @current_profile)
      raise ActiveRecord::RecordNotFound unless @declaration
    end

    def declaration_params
      params.require(:meetup_matching_declaration).permit(:intent_level, :meetup_note)
    end
  end
end

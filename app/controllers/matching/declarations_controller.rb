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

    # Renders just the modal partial (no layout). Used by inline JS on
    # /matching and /meetups/:slug to inject the E10 popup without
    # navigating away from the current page.
    def modal
      declaration = MeetupMatchingDeclaration.find_or_initialize_by(
        meetup: @meetup,
        matching_profile: @current_profile,
      )
      declaration.intent_level ||= "open_to_meet"
      render partial: "meetups/declaration_modal",
             locals: { meetup: @meetup, declaration: declaration, open: true },
             layout: false
    end

    def create
      @declaration = MeetupMatchingDeclaration.new(declaration_params.merge(
                                                     meetup: @meetup,
                                                     matching_profile: @current_profile,
                                                   ))
      if @declaration.save
        respond_with_save_success
      else
        respond_with_save_failure(status: :unprocessable_entity)
      end
    end

    def edit
      render :form
    end

    def update
      if @declaration.update(declaration_params)
        respond_with_save_success
      else
        respond_with_save_failure(status: :unprocessable_entity)
      end
    end

    def destroy
      @declaration.destroy
      redirect_to meetup_path(@meetup), notice: I18n.t("matching.declarations.deleted")
    end

    private

    def set_meetup
      slug = params[:meetup_slug] || params[:slug]
      @meetup = Meetup.visible_in_lists.find_by(slug: slug)
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

    # AJAX (fetch from the modal loader) → JSON. Non-AJAX → standard HTML
    # redirect to the referer (with the modal-trigger query stripped). The
    # JSON contract is intentionally minimal — the client just needs to
    # know "saved, close the modal" or render error messages.
    def respond_with_save_success
      respond_to do |format|
        format.json do
          render json: {
            ok: true,
            declaration: {
              intent_level: @declaration.intent_level,
              meetup_note: @declaration.meetup_note,
            },
            flash: I18n.t("matching.declarations.saved"),
          }
        end
        format.html do
          redirect_to post_save_redirect_target, notice: I18n.t("matching.declarations.saved")
        end
      end
    end

    def respond_with_save_failure(status:)
      respond_to do |format|
        format.json do
          render json: { ok: false, errors: @declaration.errors.full_messages }, status: status
        end
        format.html { render :form, status: status }
      end
    end

    # After save/update, return to the page the user came from — but strip
    # `?declare=1` so we don't loop straight back into the modal. Fall back
    # to the meetup hub when referer is missing or external.
    def post_save_redirect_target
      ref = request.referer.to_s
      return meetup_path(@meetup) if ref.blank?

      begin
        uri = URI.parse(ref)
      rescue URI::InvalidURIError
        return meetup_path(@meetup)
      end
      return meetup_path(@meetup) if uri.host.present? && uri.host != request.host

      query = Rack::Utils.parse_query(uri.query.to_s)
      query.delete("declare")
      uri.query = query.any? ? Rack::Utils.build_query(query) : nil
      uri.to_s.presence || meetup_path(@meetup)
    end
  end
end

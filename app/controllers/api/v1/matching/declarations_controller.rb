module Api
  module V1
    module Matching
      # CRUD for the per-meetup matching declaration. Web Preact widgets
      # and the native mobile app both consume this endpoint.
      #
      # Auth: `authenticate_with_api_key_or_current_user!` — session cookie
      # for web, `api-key` header for mobile.
      class DeclarationsController < ApiController
        before_action :authenticate!
        before_action :set_meetup
        before_action :load_current_profile
        before_action :require_active_profile
        before_action :require_rsvp

        def show
          declaration = MeetupMatchingDeclaration.find_by(
            meetup_id: @meetup.id,
            matching_profile_id: @current_profile.id,
          )
          render json: {
            meetup: meetup_context,
            declaration: declaration && serialize(declaration),
          }
        end

        # Upsert: create if missing, update if present. Mobile/web doesn't need
        # to know whether a declaration already exists — same payload works for
        # both. PATCH delegates to the same logic.
        def create
          upsert
        end

        def update
          upsert
        end

        def destroy
          declaration = MeetupMatchingDeclaration.find_by(
            meetup_id: @meetup.id,
            matching_profile_id: @current_profile.id,
          )
          return error_not_found if declaration.nil?

          declaration.destroy
          render json: { ok: true }
        end

        private

        def upsert
          declaration = MeetupMatchingDeclaration.find_or_initialize_by(
            meetup_id: @meetup.id,
            matching_profile_id: @current_profile.id,
          )
          was_new = declaration.new_record?
          declaration.assign_attributes(declaration_params)
          if declaration.save
            render json: { ok: true, declaration: serialize(declaration) },
                   status: was_new ? :created : :ok
          else
            error_unprocessable_entity(declaration.errors.full_messages.to_sentence)
          end
        end

        def set_meetup
          @meetup = Meetup.visible_in_lists.find_by(slug: params[:meetup_slug])
          error_not_found unless @meetup
        end

        def load_current_profile
          @current_profile = MatchingProfile.find_by(user_id: @user.id)
        end

        def require_active_profile
          return if @current_profile&.visible_to_others?

          render json: { error: "profile_required", status: 403 }, status: :forbidden
        end

        def require_rsvp
          return if MeetupRsvp.exists?(meetup_id: @meetup.id, user_id: @user.id)

          render json: { error: "rsvp_required", status: 403 }, status: :forbidden
        end

        def declaration_params
          params.require(:declaration).permit(:intent_level, :meetup_note)
        end

        def serialize(declaration)
          {
            id: declaration.id,
            meetup_id: declaration.meetup_id,
            meetup_slug: @meetup.slug,
            matching_profile_id: declaration.matching_profile_id,
            intent_level: declaration.intent_level,
            meetup_note: declaration.meetup_note,
            created_at: declaration.created_at.iso8601,
            updated_at: declaration.updated_at.iso8601,
          }
        end

        def meetup_context
          {
            slug: @meetup.slug,
            name: @meetup.name,
            start_at: @meetup.start_at.iso8601,
            venue_name: @meetup.venue_name,
          }
        end
      end
    end
  end
end

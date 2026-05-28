module Api
  module V1
    module Meetups
      # POST /api/meetups/:slug/rsvp  { status: "going"|"interested" }
      # DELETE /api/meetups/:slug/rsvp
      #
      # Idempotent upsert semantics: posting the same status twice acts as
      # a no-op (existing record returned); posting a different status
      # updates the record. The web Preact widget never has to figure out
      # create-vs-update — it just sends the desired status.
      class RsvpsController < ApiController
        before_action :authenticate!
        before_action :set_meetup

        def create
          new_status = params[:status].to_s
          return error_unprocessable_entity("invalid status") unless %w[going interested].include?(new_status)

          rsvp = MeetupRsvp.find_or_initialize_by(meetup_id: @meetup.id, user_id: @user.id)
          rsvp.status = new_status
          if rsvp.save
            @meetup.reload
            render json: rsvp_response(rsvp), status: rsvp.previously_new_record? ? :created : :ok
          else
            error_unprocessable_entity(rsvp.errors.full_messages.to_sentence)
          end
        end

        def destroy
          rsvp = MeetupRsvp.find_by(meetup_id: @meetup.id, user_id: @user.id)
          rsvp&.destroy
          @meetup.reload
          render json: rsvp_response(nil)
        end

        private

        def set_meetup
          slug = params[:meetup_slug] || params[:slug]
          @meetup = Meetup.visible_in_lists.find_by(slug: slug)
          error_not_found unless @meetup
        end

        # Returns the current state of (rsvp, meetup counts, declaration-prompt
        # hint). The hint lets the web client open the E10 declaration modal
        # right after a fresh RSVP without a second roundtrip.
        def rsvp_response(rsvp)
          {
            rsvp: rsvp ? { status: rsvp.status, meetup_slug: @meetup.slug } : nil,
            counts: {
              going: @meetup.going_count,
              interested: @meetup.interested_count,
            },
            needs_declaration_prompt: needs_declaration_prompt?(rsvp),
          }
        end

        def needs_declaration_prompt?(rsvp)
          return false unless rsvp
          profile = MatchingProfile.find_by(user_id: @user.id)
          return false unless profile&.visible_to_others?
          return false if MeetupMatchingDeclaration.exists?(meetup_id: @meetup.id, matching_profile_id: profile.id)

          true
        end
      end
    end
  end
end

module Api
  module V1
    module Matching
      # POST /api/matching/welcomes  { receiver_profile_id, meetup_id }
      #
      # Sender pisze welcome do innego matching profilu w kontekście meetupu.
      # Reguły zgodne z web ::Matching::WelcomesController: unique pair +
      # R-Lifecycle 48h + obie deklaracje active (intent != not_looking) +
      # receiver visible.
      class WelcomesController < ApiController
        before_action :authenticate!
        before_action :load_sender_profile
        before_action :require_active_sender
        before_action :load_meetup
        before_action :require_within_lifecycle
        before_action :load_receiver_profile
        before_action :require_distinct_receiver
        before_action :require_visible_receiver
        before_action :require_both_declarations_active
        before_action :reject_duplicate_welcome

        def create
          welcome = MatchingWelcome.new(
            sender_profile: @sender_profile,
            receiver_profile: @receiver_profile,
            meetup: @meetup,
            sent_at: Time.current,
          )

          if welcome.save
            body = MatchingWelcome.render_body(
              sender_profile: @sender_profile,
              meetup: @meetup,
              host: request.host,
            )
            delivery = ::Matching::DeliverWelcomeViaCloudFunction.call(welcome: welcome, body: body)
            render json: {
              ok: true,
              welcome_id: welcome.id,
              delivery: delivery[:status],
            }, status: :created
          else
            error_unprocessable_entity(welcome.errors.full_messages.to_sentence)
          end
        end

        private

        def load_sender_profile
          @sender_profile = MatchingProfile.find_by(user_id: @user.id)
        end

        def require_active_sender
          return if @sender_profile&.visible_to_others?

          render json: { error: "sender_profile_inactive", status: 403 }, status: :forbidden
        end

        def load_meetup
          @meetup = Meetup.find_by(id: params[:meetup_id])
          error_not_found unless @meetup
        end

        def require_within_lifecycle
          lifetime = ::Matching::EventScopedProfilesController::EVENT_SCOPED_LIFETIME
          return if @meetup.end_at + lifetime > Time.current

          error_not_found
        end

        def load_receiver_profile
          @receiver_profile = MatchingProfile.find_by(id: params[:receiver_profile_id])
          error_not_found unless @receiver_profile
        end

        def require_distinct_receiver
          return if @receiver_profile.id != @sender_profile.id

          error_unprocessable_entity("cannot_welcome_self")
        end

        def require_visible_receiver
          return if @receiver_profile.visible_to_others?

          error_not_found
        end

        def require_both_declarations_active
          sender_dec = MeetupMatchingDeclaration.find_by(meetup_id: @meetup.id, matching_profile_id: @sender_profile.id)
          receiver_dec = MeetupMatchingDeclaration.find_by(meetup_id: @meetup.id,
                                                            matching_profile_id: @receiver_profile.id)
          both_active = sender_dec.present? && receiver_dec.present? &&
                        sender_dec.intent_level != "not_looking" &&
                        receiver_dec.intent_level != "not_looking"
          return if both_active

          error_unprocessable_entity("declarations_missing_or_not_looking")
        end

        def reject_duplicate_welcome
          return unless MatchingWelcome.exists_between?(@sender_profile, @receiver_profile)

          render json: { error: "already_sent", status: 409 }, status: :conflict
        end
      end
    end
  end
end

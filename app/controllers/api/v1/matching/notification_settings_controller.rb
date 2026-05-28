module Api
  module V1
    module Matching
      # GET / PATCH /api/matching/notification_settings — mobile osobny
      # ekran ustawień notyfikacji (kategorie matching-specific: nowe
      # dopasowania, nowe meetupy w mieście). Web używa istniejącego
      # users/notification_settings form (Faza 0 decision — settings
      # tab stays ERB).
      class NotificationSettingsController < ApiController
        before_action :authenticate!

        def show
          settings = @user.notification_setting
          render json: { settings: serialize(settings) }
        end

        def update
          settings = @user.notification_setting
          if settings.update(update_params)
            render json: { ok: true, settings: serialize(settings) }
          else
            error_unprocessable_entity(settings.errors.full_messages.to_sentence)
          end
        end

        private

        def update_params
          params.require(:settings).permit(:notify_on_new_matches, :notify_on_new_city_meetups)
        end

        def serialize(settings)
          {
            notify_on_new_matches: settings.notify_on_new_matches,
            notify_on_new_city_meetups: settings.notify_on_new_city_meetups,
          }
        end
      end
    end
  end
end

module Messages
  class SessionsController < ApplicationController
    prepend_before_action :current_user_by_token, only: [:show]
    skip_before_action :verify_authenticity_token, if: :token_authenticated?
    before_action :authenticate_user!
    respond_to :json

    def show
      result = Messages::FirebaseSessionService.call(current_user)

      render json: {
        user: {
          id: current_user.id.to_s,
          username: current_user.username,
          displayName: current_user.name.presence || current_user.username,
          avatarUrl: current_user.profile_image_90 || ""
        },
        firebaseToken: result
      }
    rescue StandardError => e
      Rails.logger.error "Failed to generate Firebase session: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: "Failed to generate session" }, status: :internal_server_error
    end
  end
end

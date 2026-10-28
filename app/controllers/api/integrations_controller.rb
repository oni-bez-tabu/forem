module Api
  # Endpoints used by integrations such as Strefa Pary:
  # - GET  /api/integrations/me                 who is the bearer of the Forem auth token
  #                                             (the same HS256 token the mobile app gets from /auth_pass/iframe)
  # - POST /api/integrations/notifications      notifications channel (header api-key)
  class IntegrationsController < ApplicationController
    prepend_before_action :current_user_by_token, only: :me
    skip_before_action :verify_authenticity_token, only: %i[me notifications]
    before_action :disable_caching, only: %i[me notifications]

    def me
      user = token_authenticated? ? current_user : nil
      return render json: { error: "unauthorized", status: 401 }, status: :unauthorized unless user

      render json: { id: user.id.to_s, name: user.name.presence || user.username, username: user.username }
    end

    def notifications
      scope = Integrations::ApiKeys.scope_for(request.headers["api-key"])
      return render json: { ok: false, error: "unauthorized" }, status: :unauthorized unless scope

      result = Integrations::NotificationSend.call(
        scope: scope,
        user_id: params[:user_id],
        title: params[:tytul],
        body: params[:tresc],
        category: params[:kategoria],
        url: params[:url],
        dedup_key: params[:klucz_deduplikacji],
      )

      if result.accepted?
        render json: { ok: true }, status: :accepted
      elsif result.duplicate?
        render json: { ok: true, dedup: true }, status: :ok
      elsif result.rate_limited?
        render json: { ok: false, error: result.error }, status: :too_many_requests
      else
        render json: { ok: false, error: result.error }, status: :unprocessable_entity
      end
    end

    private

    def disable_caching
      response.headers["Cache-Control"] = "no-store"
    end
  end
end

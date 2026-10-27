module Api
  # Endpoints used by integrations such as Strefa Pary:
  # - GET  /api/integrations/token?aud=...      session JWT for the logged-in user (cookie session)
  # - GET  /api/integrations/jwks, /.well-known/jwks.json   public key set
  # - POST /api/integrations/notifications      notifications channel (header api-key)
  class IntegrationsController < ApplicationController
    skip_before_action :verify_authenticity_token, only: :notifications
    before_action :disable_caching, only: %i[token notifications]

    def token
      return render json: { error: "unauthorized", status: 401 }, status: :unauthorized unless user_signed_in?
      if params[:aud].blank?
        return render json: { error: "aud is required", status: 422 }, status: :unprocessable_entity
      end

      render json: Integrations::Token.issue(user: current_user, aud: params[:aud])
    rescue Integrations::Token::UnknownAudience
      render json: { error: "unknown aud", status: 422 }, status: :unprocessable_entity
    rescue Integrations::Token::NotConfigured => e
      Rails.logger.error("integrations token: #{e.message}")
      render json: { error: "integrations not configured", status: 503 }, status: :service_unavailable
    end

    def jwks
      unless Integrations::JwtKeys.configured?
        return render json: { keys: [] }, status: :service_unavailable
      end

      expires_in 1.hour, public: true
      render json: Integrations::JwtKeys.jwks
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

module Matching
  # POC integration seam: posts to a Firebase Cloud Function that writes the
  # welcome message to the Firestore-backed chat. The CF lives outside this
  # repo (and may not exist yet) — if MATCHING_WELCOME_CLOUD_FUNCTION_URL is
  # unset we log a warning and treat the delivery as successful so the
  # MatchingWelcome record still tracks "sent" intent in the POC.
  #
  # Return shape: { ok: Boolean, status: :delivered | :stubbed | :failed, error: String? }
  module DeliverWelcomeViaCloudFunction
    TIMEOUT_SECONDS = 5

    def self.call(welcome:, body:)
      url = ApplicationConfig["MATCHING_WELCOME_CLOUD_FUNCTION_URL"]
      payload = {
        sender_user_id: welcome.sender_profile.user_id,
        receiver_user_id: welcome.receiver_profile.user_id,
        body: body,
        meetup_slug: welcome.meetup.slug,
        welcome_id: welcome.id
      }

      if url.blank?
        Rails.logger.warn(
          "[Matching::DeliverWelcomeViaCloudFunction] stub — " \
          "MATCHING_WELCOME_CLOUD_FUNCTION_URL not set, " \
          "welcome_id=#{welcome.id}",
        )
        return { ok: true, status: :stubbed }
      end

      response = HTTParty.post(
        url,
        body: payload.to_json,
        headers: { "Content-Type" => "application/json" },
        timeout: TIMEOUT_SECONDS,
      )

      if response.success?
        { ok: true, status: :delivered }
      else
        Rails.logger.error(
          "[Matching::DeliverWelcomeViaCloudFunction] non-2xx response " \
          "(#{response.code}) for welcome_id=#{welcome.id}",
        )
        { ok: false, status: :failed, error: "cloud_function_returned_#{response.code}" }
      end
    rescue StandardError => e
      Rails.logger.error(
        "[Matching::DeliverWelcomeViaCloudFunction] exception for welcome_id=#{welcome.id}: #{e.class} #{e.message}",
      )
      { ok: false, status: :failed, error: e.message }
    end
  end
end

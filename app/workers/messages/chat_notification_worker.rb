module Messages
  class ChatNotificationWorker
    include Sidekiq::Job
    sidekiq_options queue: :low_priority, retry: 10

    def perform(payload_json)
      payload = JSON.parse(payload_json)
      Rails.logger.info "ChatNotificationWorker start: toUser=#{payload.dig('toUser', 'id')} fromUser=#{payload.dig('fromUser', 'id')} message=#{payload.dig('message', 'id')}"
      Messages::ChatNotification::Send.call(payload)
    rescue JSON::ParserError => e
      Rails.logger.error "Failed to parse chat notification payload: #{e.message}"
    rescue StandardError => e
      Rails.logger.error "Error processing chat notification: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      raise # Re-raise to trigger Sidekiq retry
    end
  end
end

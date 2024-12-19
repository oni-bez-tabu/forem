  module PushNotifications
    class OneSignalWorker
      include Sidekiq::Job
  
      sidekiq_options queue: :medium_priority, retry: 5
  
      def perform(user_ids, title, body, url)
        send_web_push(user_ids.map(&:to_s), title, body, url)
      end
  
      private
  
      def send_web_push(user_ids, title, body, redirectUrl)
        url = "https://onesignal.com/api/v1/notifications"
        headers = {
          "Content-Type": "application/json",
          "Authorization": "Basic #{ApplicationConfig['ONESIGNAL_API_KEY']}"
        }
        body = {
          app_id: ApplicationConfig['ONESIGNAL_APP_ID'],
          include_external_user_ids: user_ids,
          headings: { en: title },
          contents: { en: body }
        }
        body[:url] = redirectUrl if redirectUrl.present?
  
        response = HTTParty.post(url, headers: headers, body: body.to_json)
      rescue => e
        Rails.logger.error("Failed to send OneSignal notification: #{e.message}")
      end
    end
  end
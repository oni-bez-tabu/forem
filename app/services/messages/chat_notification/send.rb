module Messages
  module ChatNotification
    class Send
      include ActionView::Helpers::TextHelper

      delegate :user_data, to: Notifications

      def self.call(payload)
        new(payload).call
      end

      def initialize(payload)
        @payload = payload
      end

      def call
        message_id = payload.dig("message", "id").to_s
        recipients  = payload["recipients"].filter_map { |r| r["id"]&.to_s }.reject(&:blank?)

        if recipients.empty?
          Rails.logger.warn "ChatNotification::Send: no recipients found"
          return
        end

        recipients.each { |recipient_id| process_for_recipient(message_id, recipient_id) }
      end

      private

      attr_reader :payload

      def json_data
        {
          user: from_user_data,
          thread: {
            id: payload.dig("thread", "id"),
            type: payload.dig("thread", "type"),
            name: payload.dig("thread", "name")
          },
          message: {
            id: payload.dig("message", "id"),
            type: payload.dig("message", "type"),
            created_at: parse_timestamp(payload.dig("message", "createdAt"))
          }
        }
      end

      def from_user_data
        from_user_id = payload.dig("fromUser", "id").to_s
        from_user = User.find_by(id: from_user_id)
        return {} unless from_user

        user_data(from_user)
      end

      def parse_timestamp(timestamp_hash)
        return nil unless timestamp_hash.is_a?(Hash)

        seconds = timestamp_hash["_seconds"]
        return nil unless seconds

        Time.at(seconds)
      rescue StandardError
        nil
      end

      def process_for_recipient(message_id, to_user_id)
        unless mark_as_processed(message_id, to_user_id)
          Rails.logger.info "ChatNotification::Send: duplicate skipped message=#{message_id} to_user=#{to_user_id}"
          return
        end

        to_user = User.find_by(id: to_user_id)
        unless to_user
          Rails.logger.warn "ChatNotification::Send: to_user not found id=#{to_user_id}"
          return
        end

        notification_setting = Users::NotificationSetting.find_by(user_id: to_user.id)
        unless notification_setting
          Rails.logger.warn "ChatNotification::Send: notification_setting missing user_id=#{to_user.id}"
          return
        end

        if notification_setting.email_chat_notifications? && to_user.email.present?
          Messages::SendChatEmailNotificationWorker.perform_async(
            to_user.id,
            payload.dig("fromUser", "id").to_s,
            payload.dig("thread", "id"),
            payload.dig("thread", "name"),
            payload.dig("thread", "type")
          )
        end

        return unless notification_setting.mobile_chat_notifications?

        from_user = User.find_by(id: payload.dig("fromUser", "id").to_s)
        return unless from_user

        I18n.with_locale(Settings::UserExperience.default_locale) do
          PushNotifications::Send.call(
            user_ids: [to_user.id],
            title: I18n.t("services.notifications.chat_message.new"),
            body: I18n.t("services.notifications.chat_message.body", user: from_user.name.presence || from_user.username),
            payload: { url: URL.url(chat_path(from_user)), type: "chat message" }
          )
        end
      end

      def chat_path(from_user)
        thread_type = payload.dig("thread", "type")
        thread_id   = payload.dig("thread", "id")

        if thread_type == "group" && thread_id.present?
          "/message/#{thread_id}"
        else
          "/message/@#{from_user.username}"
        end
      end

      def mark_as_processed(message_id, to_user_id)
        Rails.cache.write(
          "chat_webhook:#{message_id}:#{to_user_id}",
          "1",
          unless_exist: true,
          expires_in: 7.days
        )
      end
    end
  end
end

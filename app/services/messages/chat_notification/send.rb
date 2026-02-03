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

        # Deduplikacja przez Redis - atomowy SETNX z TTL
        unless mark_as_processed(message_id)
          Rails.logger.info "ChatNotification::Send: duplicate webhook skipped external_id=#{message_id}"
          return
        end

        to_user_id = payload.dig("toUser", "id").to_s
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

        # Send email notification if enabled
        if notification_setting.email_chat_notifications? && to_user.email.present?
          Messages::SendChatEmailNotificationWorker.perform_async(
            to_user.id,
            payload.dig("fromUser", "id").to_s,
            payload.dig("thread", "id"),
            payload.dig("thread", "name"),
            payload.dig("thread", "type")
          )
          Rails.logger.info "ChatNotification::Send: email enqueued user_id=#{to_user.id}"
        else
          Rails.logger.info "ChatNotification::Send: email skipped user_id=#{to_user.id} enabled=#{notification_setting.email_chat_notifications?} email_present=#{to_user.email.present?}"
        end

        # Send push notification if enabled
        unless notification_setting.mobile_chat_notifications?
          Rails.logger.info "ChatNotification::Send: push disabled user_id=#{to_user.id}"
          return
        end

        from_user_id = payload.dig("fromUser", "id").to_s
        from_user = User.find_by(id: from_user_id)
        unless from_user
          Rails.logger.warn "ChatNotification::Send: from_user not found id=#{from_user_id}"
          return
        end

        thread_name = payload.dig("thread", "name") || from_user.name || from_user.username

        I18n.with_locale(Settings::UserExperience.default_locale) do
          localized_title = I18n.t("services.notifications.chat_message.new")
          localized_message = I18n.t(
            "services.notifications.chat_message.body",
            user: from_user.name.presence || from_user.username,
          )

          PushNotifications::Send.call(
            user_ids: [to_user.id],
            title: localized_title,
            body: localized_message,
            payload: {
              url: URL.url(chat_path(from_user)),
              type: "chat message"
            },
          )
          Rails.logger.info "ChatNotification::Send: push enqueued user_id=#{to_user.id} from_user_id=#{from_user.id}"
        end
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

      def chat_path(from_user)
        thread_type = payload.dig("thread", "type")
        thread_name = payload.dig("thread", "name")

        if thread_type == "group" && thread_name.present?
          "/message/#{thread_name}"
        else
          "/message/@#{from_user.username}"
        end
      end

      def mark_as_processed(message_id)
        # Zwraca true jeśli to nowa wiadomość, false jeśli duplikat
        Rails.cache.write(
          "chat_webhook:#{message_id}",
          "1",
          unless_exist: true,
          expires_in: 7.days
        )
      end
    end
  end
end

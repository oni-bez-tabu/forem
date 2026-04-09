module Messages
  class SendChatEmailNotificationWorker
    include Sidekiq::Job
    sidekiq_options queue: :default, retry: 10

    def perform(to_user_id, from_user_id, thread_id, thread_name = nil, thread_type = nil)
      to_user = User.find_by(id: to_user_id)
      return unless to_user

      from_user = User.find_by(id: from_user_id)
      return unless from_user

      NotifyMailer.with(
        to_user: to_user,
        from_user: from_user,
        thread_id: thread_id,
        thread_name: thread_name,
        thread_type: thread_type
      ).new_chat_message_email.deliver_now
    end
  end
end

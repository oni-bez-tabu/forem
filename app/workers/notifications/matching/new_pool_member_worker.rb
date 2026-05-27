module Notifications
  module Matching
    class NewPoolMemberWorker
      include Sidekiq::Job
      sidekiq_options queue: :default, retry: 5, lock: :until_executing, on_conflict: :replace

      def perform(declaration_id)
        ::Notifications::Matching::NewPoolMember::Send.call(declaration_id)
      end
    end
  end
end

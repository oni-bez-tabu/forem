module Notifications
  module Meetups
    class NewCityMeetupWorker
      include Sidekiq::Job
      sidekiq_options queue: :default, retry: 5, lock: :until_executing, on_conflict: :replace

      def perform(meetup_id)
        ::Notifications::Meetups::NewCityMeetup::Send.call(meetup_id)
      end
    end
  end
end

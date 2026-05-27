module Matching
  class DeactivateProfileOnBanWorker
    include Sidekiq::Job

    sidekiq_options queue: :low_priority, retry: 5, lock: :until_executing, on_conflict: :replace

    def perform(user_id)
      user = User.find_by(id: user_id)
      return unless user
      return unless user.suspended?

      profile = MatchingProfile.find_by(user_id: user.id)
      return unless profile

      # Per session #1 decision: ban deactivates the profile AND wipes intents/
      # declarations. Welcome conversations stay because they live in chat.
      profile.matching_declarations.destroy_all
      profile.deactivate! if profile.is_active?
    end
  end
end

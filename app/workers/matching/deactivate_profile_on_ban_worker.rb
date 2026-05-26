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
      return unless profile.is_active?

      profile.deactivate!
    end
  end
end

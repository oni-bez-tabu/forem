module Talks
  class CloseExpiredWorker
    include Sidekiq::Worker

    def perform
      Talk.where("created_at <= ? AND status IN (?)", 2.hours.ago, [Talk.statuses[:started]])
          .find_each do |talk|
        
        response = Talks::BanUserService.call(talk.channel_id)
        
        if response[:success]
          talk.update(status: :banned)
        else
          Rails.logger.error("Nie udało się zbanować talka #{talk.id}: #{response[:error]}")
        end
      end
    end
  end
end 
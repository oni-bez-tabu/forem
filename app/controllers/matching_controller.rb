class MatchingController < ApplicationController
  TIMELINE_LIMIT = 30
  RECOMMENDATIONS_LIMIT = 3

  before_action :authenticate_user!

  def show
    @profile = MatchingProfile.find_by(user_id: current_user.id)

    return unless @profile&.visible_to_others?

    @timeline = Matching::TimelineFeed.new(user: current_user, limit: TIMELINE_LIMIT).call
    @recommendations = Matching::MeetupRecommendations.new(user: current_user, limit: RECOMMENDATIONS_LIMIT).call
    @new_matches_count = @timeline
      .select { |e| e[:type] == :match_found }
      .sum { |e| e[:payload][:count].to_i }
  end
end

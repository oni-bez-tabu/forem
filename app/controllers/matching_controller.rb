class MatchingController < ApplicationController
  before_action :authenticate_user!

  def show
    @profile = MatchingProfile.find_by(user_id: current_user.id)
  end
end

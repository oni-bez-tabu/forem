class MatchingController < ApplicationController
  before_action :authenticate_user!

  # SPA shell. Users without a profile get redirected to the onboarding
  # intro; everyone else hits the Preact app which fetches
  # /api/matching/dashboard for its data.
  def show
    return redirect_to matching_onboarding_path unless MatchingProfile.exists?(user_id: current_user.id)
  end
end

class MatchingController < ApplicationController
  before_action :authenticate_user!

  # SSR shell — profile header renderuje się od razu (instant, bez spinnera).
  # Listę aktywności + recommendations dociąga Preact z /api/matching/dashboard
  # i renderuje pod headerem (loading state = skeleton, nie spinner).
  def show
    @profile = MatchingProfile.find_by(user_id: current_user.id)
    return redirect_to matching_onboarding_path if @profile.nil?
  end
end

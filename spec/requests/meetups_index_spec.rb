require "rails_helper"

RSpec.describe "GET /meetups" do
  let!(:upcoming)         { create(:meetup, name: "Upcoming Soiree") }
  let!(:recently_ended)   { create(:meetup, :recently_ended, name: "Recently Ended Mixer") }
  let!(:expired)          { create(:meetup, :expired_for_lists, name: "Ancient Event") }
  let!(:unpublished)      { create(:meetup, :unpublished, name: "Hidden Draft") }

  it "returns 200" do
    get meetups_path
    expect(response).to have_http_status(:ok)
  end

  it "lists published meetups inside the 24h grace window" do
    get meetups_path
    expect(response.body).to include(upcoming.name)
    expect(response.body).to include(recently_ended.name)
  end

  it "hides expired meetups (>24h past end_at) and unpublished ones" do
    get meetups_path
    expect(response.body).not_to include(expired.name)
    expect(response.body).not_to include(unpublished.name)
  end
end

require "rails_helper"

RSpec.describe "GET /m/:meetup_slug/:profile_id" do
  let(:viewer) { create(:user) }
  let(:meetup) { create(:meetup) }
  let(:target_profile) { create(:matching_profile, :approved) }
  let!(:target_rsvp) { create(:meetup_rsvp, meetup: meetup, user: target_profile.user, status: "going") }
  let!(:target_declaration) do
    create(:meetup_matching_declaration, meetup: meetup, matching_profile: target_profile, meetup_note: "see you there")
  end

  before { sign_in viewer }

  it "renders the event-scoped profile" do
    get event_scoped_profile_path(meetup.slug, target_profile.id)
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("see you there")
  end

  it "404s for an unknown meetup" do
    expect { get "/m/unknown-meetup/#{target_profile.id}" }
      .to raise_error(ActiveRecord::RecordNotFound)
  end

  it "404s after the 48h lifecycle window" do
    meetup.update_columns(start_at: 4.days.ago, end_at: 3.days.ago)
    expect { get event_scoped_profile_path(meetup.slug, target_profile.id) }
      .to raise_error(ActiveRecord::RecordNotFound)
  end

  it "404s when the target declared not_looking" do
    target_declaration.update_columns(intent_level: "not_looking", looking_for: [])
    expect { get event_scoped_profile_path(meetup.slug, target_profile.id) }
      .to raise_error(ActiveRecord::RecordNotFound)
  end

  it "404s when the target's profile is inactive" do
    target_profile.update!(is_active: false)
    expect { get event_scoped_profile_path(meetup.slug, target_profile.id) }
      .to raise_error(ActiveRecord::RecordNotFound)
  end
end

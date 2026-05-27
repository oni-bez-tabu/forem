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
    target_declaration.update_columns(intent_level: "not_looking")
    expect { get event_scoped_profile_path(meetup.slug, target_profile.id) }
      .to raise_error(ActiveRecord::RecordNotFound)
  end

  it "404s when the target's profile is inactive" do
    target_profile.update!(is_active: false)
    expect { get event_scoped_profile_path(meetup.slug, target_profile.id) }
      .to raise_error(ActiveRecord::RecordNotFound)
  end

  context "welcome modal states" do
    let(:viewer_profile) { create(:matching_profile, :approved, user: viewer) }

    before do
      create(:meetup_rsvp, meetup: meetup, user: viewer, status: "going")
      create(:meetup_matching_declaration, meetup: meetup, matching_profile: viewer_profile, intent_level: "open_to_meet")
    end

    it "shows the active send-welcome button when viewer is eligible" do
      get event_scoped_profile_path(meetup.slug, target_profile.id)
      expect(response.body).to include(I18n.t("matching.welcomes.send_button"))
      expect(response.body).to include("data-welcome-open")
    end

    it "shows the already-sent state when a welcome between this pair already exists" do
      create(:matching_welcome, sender_profile: viewer_profile, receiver_profile: target_profile, meetup: meetup)
      get event_scoped_profile_path(meetup.slug, target_profile.id)
      expect(response.body).to include(I18n.t("matching.welcomes.already_sent_button"))
      expect(response.body).not_to include("data-welcome-open")
    end

    it "shows the not-eligible hint when viewer has no declaration on this meetup" do
      MeetupMatchingDeclaration.where(matching_profile_id: viewer_profile.id).destroy_all
      get event_scoped_profile_path(meetup.slug, target_profile.id)
      expect(response.body).to include(I18n.t("matching.welcomes.not_eligible_hint"))
      expect(response.body).not_to include("data-welcome-open")
    end

    it "shows the not-eligible hint when viewer's profile is inactive" do
      viewer_profile.update!(is_active: false)
      get event_scoped_profile_path(meetup.slug, target_profile.id)
      expect(response.body).to include(I18n.t("matching.welcomes.not_eligible_hint"))
    end
  end
end

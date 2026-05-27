require "rails_helper"

RSpec.describe "POST /matching/welcomes" do
  let(:sender_user) { create(:user) }
  let(:sender_profile) { create(:matching_profile, :approved, user: sender_user) }
  let(:receiver_profile) { create(:matching_profile, :approved) }
  let(:meetup) { create(:meetup) }

  before do
    # Both sides RSVP + declare with intent != not_looking
    create(:meetup_rsvp, meetup: meetup, user: sender_profile.user, status: "going")
    create(:meetup_rsvp, meetup: meetup, user: receiver_profile.user, status: "going")
    create(:meetup_matching_declaration, meetup: meetup, matching_profile: sender_profile, intent_level: "open_to_meet")
    create(:meetup_matching_declaration, meetup: meetup, matching_profile: receiver_profile,
                                         intent_level: "open_to_meet")
    # Stub Cloud Function — POC default is stubbed (no env), but we make it explicit.
    allow(Matching::DeliverWelcomeViaCloudFunction).to receive(:call).and_return(ok: true, status: :stubbed)
    sign_in sender_user
  end

  def post_welcome(overrides = {})
    post matching_welcomes_path, params: {
      receiver_profile_id: receiver_profile.id,
      meetup_id: meetup.id
    }.merge(overrides)
  end

  it "creates a welcome and triggers delivery" do
    expect do
      post_welcome
    end.to change(MatchingWelcome, :count).by(1)
    expect(response).to have_http_status(:created)
    json = response.parsed_body
    expect(json["status"]).to eq("ok")
    expect(json["delivery"]).to eq("stubbed")
    expect(Matching::DeliverWelcomeViaCloudFunction).to have_received(:call)
  end

  it "passes the rendered template body to the delivery service" do
    expect(Matching::DeliverWelcomeViaCloudFunction).to receive(:call) do |welcome:, body:|
      expect(body).to include("/m/#{meetup.slug}/#{sender_profile.id}")
      expect(welcome).to be_a(MatchingWelcome)
      { ok: true, status: :stubbed }
    end
    post_welcome
  end

  it "409s when a welcome to this receiver already exists" do
    create(:matching_welcome, sender_profile: sender_profile, receiver_profile: receiver_profile, meetup: meetup)
    post_welcome
    expect(response).to have_http_status(:conflict)
    expect(response.parsed_body["error"]).to eq("already_sent")
  end

  it "409s even if the previous welcome was for a different meetup (per-person uniqueness)" do
    other_meetup = create(:meetup)
    create(:matching_welcome, sender_profile: sender_profile, receiver_profile: receiver_profile, meetup: other_meetup)
    post_welcome
    expect(response).to have_http_status(:conflict)
  end

  it "404s after the 48h lifecycle window" do
    meetup.update_columns(start_at: 4.days.ago, end_at: 3.days.ago)
    expect { post_welcome }.to raise_error(ActiveRecord::RecordNotFound)
  end

  it "422s when receiver has no declaration on this meetup" do
    MeetupMatchingDeclaration.where(matching_profile_id: receiver_profile.id).destroy_all
    post_welcome
    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.parsed_body["error"]).to eq("declarations_missing_or_not_looking")
  end

  it "422s when receiver declared not_looking (R4)" do
    MeetupMatchingDeclaration.where(matching_profile_id: receiver_profile.id)
      .update_all(intent_level: "not_looking")
    post_welcome
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it "422s when sender declared not_looking (R4)" do
    MeetupMatchingDeclaration.where(matching_profile_id: sender_profile.id)
      .update_all(intent_level: "not_looking")
    post_welcome
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it "404s when receiver profile is inactive" do
    receiver_profile.update!(is_active: false)
    expect { post_welcome }.to raise_error(ActiveRecord::RecordNotFound)
  end

  it "forbids when sender has no approved+active profile" do
    sender_profile.update!(is_active: false)
    post_welcome
    expect(response).to have_http_status(:forbidden)
    expect(response.parsed_body["error"]).to eq("sender_profile_inactive")
  end

  it "422s when sender tries to welcome themselves" do
    self_user = create(:user)
    self_profile = create(:matching_profile, :approved, user: self_user)
    sign_in self_user
    post matching_welcomes_path, params: {
      receiver_profile_id: self_profile.id,
      meetup_id: meetup.id
    }
    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.parsed_body["error"]).to eq("cannot_welcome_self")
  end

  it "redirects unauthenticated users" do
    sign_out sender_user
    post_welcome
    expect(response).to have_http_status(:redirect)
  end
end

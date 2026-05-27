require "rails_helper"

RSpec.describe Notifications::Matching::NewPoolMember::Send do
  let(:meetup) { create(:meetup) }
  let(:joiner_profile) { create(:matching_profile, :approved) }
  let(:joiner_declaration) do
    create(:meetup_matching_declaration,
           meetup: meetup,
           matching_profile: joiner_profile,
           intent_level: "open_to_meet")
  end

  # Three existing pool members
  let(:active_profiles) { create_list(:matching_profile, 2, :approved) }
  let(:not_looking_profile) { create(:matching_profile, :approved) }

  before do
    active_profiles.each do |p|
      create(:meetup_rsvp, meetup: meetup, user: p.user, status: "going")
      create(:meetup_matching_declaration, meetup: meetup, matching_profile: p, intent_level: "open_to_meet")
    end
    create(:meetup_rsvp, meetup: meetup, user: not_looking_profile.user, status: "going")
    create(:meetup_matching_declaration, meetup: meetup, matching_profile: not_looking_profile, intent_level: "not_looking")
    allow(PushNotifications::Send).to receive(:call)
  end

  it "creates an in-app Notification for each pre-existing active pool member" do
    expect {
      described_class.call(joiner_declaration.id)
    }.to change { Notification.where(action: "matching_pool_member").count }.by(2)
  end

  it "skips the not_looking pool member" do
    described_class.call(joiner_declaration.id)
    notified_user_ids = Notification.where(action: "matching_pool_member").pluck(:user_id)
    expect(notified_user_ids).not_to include(not_looking_profile.user_id)
  end

  it "skips the new joiner themselves" do
    described_class.call(joiner_declaration.id)
    notified_user_ids = Notification.where(action: "matching_pool_member").pluck(:user_id)
    expect(notified_user_ids).not_to include(joiner_profile.user_id)
  end

  it "calls PushNotifications::Send once with the recipient list and meetup title" do
    described_class.call(joiner_declaration.id)
    expect(PushNotifications::Send).to have_received(:call).with(
      hash_including(
        user_ids: array_including(active_profiles.map(&:user_id)),
        title: include(meetup.name),
      ),
    )
  end

  it "filters out recipients with notify_on_new_matches=false" do
    optout = active_profiles.first
    Users::NotificationSetting.find_by(user_id: optout.user_id).update!(notify_on_new_matches: false)
    described_class.call(joiner_declaration.id)
    notified_user_ids = Notification.where(action: "matching_pool_member").pluck(:user_id)
    expect(notified_user_ids).not_to include(optout.user_id)
    expect(notified_user_ids).to include(active_profiles.last.user_id)
  end

  it "does nothing when the new declaration is not_looking" do
    not_looking_dec = create(:matching_profile, :approved)
    create(:meetup_rsvp, meetup: meetup, user: not_looking_dec.user, status: "going")
    new_dec = create(:meetup_matching_declaration, meetup: meetup, matching_profile: not_looking_dec, intent_level: "not_looking")
    Notification.where(action: "matching_pool_member").destroy_all

    described_class.call(new_dec.id)
    expect(Notification.where(action: "matching_pool_member").count).to eq(0)
    expect(PushNotifications::Send).not_to have_received(:call)
  end

  it "no-ops when the joiner's profile is not visible_to_others (e.g. pending)" do
    pending_profile = create(:matching_profile)
    create(:meetup_rsvp, meetup: meetup, user: pending_profile.user, status: "going")
    new_dec = create(:meetup_matching_declaration, meetup: meetup, matching_profile: pending_profile, intent_level: "open_to_meet")
    Notification.where(action: "matching_pool_member").destroy_all

    described_class.call(new_dec.id)
    expect(Notification.where(action: "matching_pool_member").count).to eq(0)
  end

  it "no-ops when the declaration id does not exist" do
    expect {
      described_class.call(9_999_999)
    }.not_to change(Notification, :count)
  end
end

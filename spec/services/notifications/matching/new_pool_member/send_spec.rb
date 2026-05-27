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

  let(:active_profiles) { create_list(:matching_profile, 2, :approved) }
  let(:not_looking_profile) { create(:matching_profile, :approved) }

  let(:captured) { { args: nil, calls: 0 } }

  before do
    active_profiles.each do |p|
      create(:meetup_rsvp, meetup: meetup, user: p.user, status: "going")
      create(:meetup_matching_declaration, meetup: meetup, matching_profile: p, intent_level: "open_to_meet")
    end
    create(:meetup_rsvp, meetup: meetup, user: not_looking_profile.user, status: "going")
    create(:meetup_matching_declaration, meetup: meetup, matching_profile: not_looking_profile, intent_level: "not_looking")

    allow(PushNotifications::Send).to receive(:call) do |**args|
      captured[:args] = args
      captured[:calls] += 1
    end
  end

  it "does not write to the Notification table (push-only delivery)" do
    expect {
      described_class.call(joiner_declaration.id)
    }.not_to change(Notification, :count)
  end

  it "pushes once with the active pool members as recipients (excluding the joiner and not_looking)" do
    described_class.call(joiner_declaration.id)
    expect(captured[:calls]).to eq(1)
    expect(captured[:args][:user_ids]).to match_array(active_profiles.map(&:user_id))
    expect(captured[:args][:title]).to include(meetup.name)
  end

  it "filters out recipients with notify_on_new_matches=false" do
    optout = active_profiles.first
    Users::NotificationSetting.find_by(user_id: optout.user_id).update!(notify_on_new_matches: false)
    described_class.call(joiner_declaration.id)
    expect(captured[:args][:user_ids]).not_to include(optout.user_id)
    expect(captured[:args][:user_ids]).to include(active_profiles.last.user_id)
  end

  it "no-ops when the new declaration is not_looking" do
    nl_profile = create(:matching_profile, :approved)
    create(:meetup_rsvp, meetup: meetup, user: nl_profile.user, status: "going")
    new_dec = create(:meetup_matching_declaration, meetup: meetup, matching_profile: nl_profile, intent_level: "not_looking")

    described_class.call(new_dec.id)
    expect(captured[:calls]).to eq(0)
  end

  it "no-ops when the joiner's profile is not visible_to_others" do
    pending_profile = create(:matching_profile)
    create(:meetup_rsvp, meetup: meetup, user: pending_profile.user, status: "going")
    new_dec = create(:meetup_matching_declaration, meetup: meetup, matching_profile: pending_profile, intent_level: "open_to_meet")

    described_class.call(new_dec.id)
    expect(captured[:calls]).to eq(0)
  end

  it "no-ops when the declaration id does not exist" do
    described_class.call(9_999_999)
    expect(captured[:calls]).to eq(0)
  end

  it "no-ops when no other active pool members exist" do
    MeetupMatchingDeclaration.where(meetup_id: meetup.id).where.not(matching_profile_id: joiner_profile.id).destroy_all
    described_class.call(joiner_declaration.id)
    expect(captured[:calls]).to eq(0)
  end
end

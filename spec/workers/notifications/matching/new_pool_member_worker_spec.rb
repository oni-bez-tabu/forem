require "rails_helper"

RSpec.describe Notifications::Matching::NewPoolMemberWorker do
  let(:declaration) { create(:meetup_matching_declaration) }

  it "delegates to the Send service with the declaration id" do
    allow(Notifications::Matching::NewPoolMember::Send).to receive(:call)
    described_class.new.perform(declaration.id)
    expect(Notifications::Matching::NewPoolMember::Send).to have_received(:call).with(declaration.id)
  end

  it "is enqueued automatically when a new active declaration is created" do
    meetup = create(:meetup)
    profile = create(:matching_profile, :approved)
    create(:meetup_rsvp, meetup: meetup, user: profile.user, status: "going")

    expect {
      create(:meetup_matching_declaration,
             meetup: meetup,
             matching_profile: profile,
             intent_level: "open_to_meet")
    }.to change(described_class.jobs, :size).by(1)
  end

  it "is NOT enqueued for not_looking declarations" do
    meetup = create(:meetup)
    profile = create(:matching_profile, :approved)
    create(:meetup_rsvp, meetup: meetup, user: profile.user, status: "going")

    expect {
      create(:meetup_matching_declaration,
             meetup: meetup,
             matching_profile: profile,
             intent_level: "not_looking")
    }.not_to change(described_class.jobs, :size)
  end
end

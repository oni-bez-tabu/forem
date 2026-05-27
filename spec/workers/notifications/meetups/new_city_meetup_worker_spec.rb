require "rails_helper"

RSpec.describe Notifications::Meetups::NewCityMeetupWorker do
  it "delegates to the Send service with the meetup id" do
    meetup = create(:meetup)
    allow(Notifications::Meetups::NewCityMeetup::Send).to receive(:call)
    described_class.new.perform(meetup.id)
    expect(Notifications::Meetups::NewCityMeetup::Send).to have_received(:call).with(meetup.id)
  end

  describe "enqueue triggers" do
    let(:city) { create(:city) }

    it "is enqueued when a meetup is created already published" do
      expect {
        create(:meetup, venue_city: city, is_published: true)
      }.to change(described_class.jobs, :size).by(1)
    end

    it "is enqueued when an existing draft is flipped to published" do
      draft = create(:meetup, :unpublished, venue_city: city)
      described_class.jobs.clear
      expect {
        draft.update!(is_published: true)
      }.to change(described_class.jobs, :size).by(1)
    end

    it "is NOT enqueued when is_published is unchanged" do
      meetup = create(:meetup, venue_city: city, is_published: true)
      described_class.jobs.clear
      expect {
        meetup.update!(venue_name: "New Venue")
      }.not_to change(described_class.jobs, :size)
    end

    it "is NOT enqueued when published is toggled back off" do
      meetup = create(:meetup, venue_city: city, is_published: true)
      described_class.jobs.clear
      expect {
        meetup.update!(is_published: false)
      }.not_to change(described_class.jobs, :size)
    end
  end
end

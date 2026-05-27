require "rails_helper"

RSpec.describe Notifications::Meetups::NewCityMeetup::Send do
  let(:warsaw) { create(:city, name: "Warszawa", slug: "warszawa-#{SecureRandom.hex(3)}") }
  let(:krakow) { create(:city, name: "Kraków", slug: "krakow-#{SecureRandom.hex(3)}") }
  let(:everywhere) { create(:city, name: "🌍 Wszędzie", slug: "everywhere-#{SecureRandom.hex(3)}", is_special: true) }

  let(:warsaw_profile) { create(:matching_profile, :approved, city: warsaw) }
  let(:krakow_profile) { create(:matching_profile, :approved, city: krakow) }
  let(:everywhere_profile) { create(:matching_profile, :approved, city: everywhere) }
  let(:pending_warsaw_profile) { create(:matching_profile, city: warsaw) }

  let(:meetup) { create(:meetup, venue_city: warsaw, is_published: true) }

  let(:captured) { { args: nil, calls: 0 } }

  before do
    warsaw_profile
    krakow_profile
    everywhere_profile
    pending_warsaw_profile

    allow(PushNotifications::Send).to receive(:call) do |**args|
      captured[:args] = args
      captured[:calls] += 1
    end
  end

  it "does not write to the Notification table" do
    expect { described_class.call(meetup.id) }.not_to change(Notification, :count)
  end

  it "pushes to users in the meetup's city" do
    described_class.call(meetup.id)
    expect(captured[:args][:user_ids]).to include(warsaw_profile.user_id)
  end

  it "pushes to users with the 'everywhere' special city" do
    described_class.call(meetup.id)
    expect(captured[:args][:user_ids]).to include(everywhere_profile.user_id)
  end

  it "skips users in other cities" do
    described_class.call(meetup.id)
    expect(captured[:args][:user_ids]).not_to include(krakow_profile.user_id)
  end

  it "skips pending/inactive matching profiles" do
    described_class.call(meetup.id)
    expect(captured[:args][:user_ids]).not_to include(pending_warsaw_profile.user_id)
  end

  it "respects notify_on_new_city_meetups=false" do
    Users::NotificationSetting.find_by(user_id: warsaw_profile.user_id).update!(notify_on_new_city_meetups: false)
    described_class.call(meetup.id)
    expect(captured[:args][:user_ids]).not_to include(warsaw_profile.user_id)
    expect(captured[:args][:user_ids]).to include(everywhere_profile.user_id)
  end

  it "pushes with localized title containing the city name" do
    described_class.call(meetup.id)
    expect(captured[:args][:title]).to include(warsaw.name)
  end

  it "no-ops on unpublished meetups" do
    draft = create(:meetup, :unpublished, venue_city: warsaw)
    described_class.call(draft.id)
    expect(captured[:calls]).to eq(0)
  end

  it "no-ops when the meetup id is unknown" do
    described_class.call(9_999_999)
    expect(captured[:calls]).to eq(0)
  end
end

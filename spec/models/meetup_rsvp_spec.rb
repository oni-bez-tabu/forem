require "rails_helper"

RSpec.describe MeetupRsvp do
  let(:meetup) { create(:meetup) }
  let(:user)   { create(:user) }

  describe "validations" do
    it "is valid with default factory" do
      expect(build(:meetup_rsvp)).to be_valid
    end

    it "rejects unknown statuses" do
      rsvp = build(:meetup_rsvp, status: "maybe")
      expect(rsvp).not_to be_valid
      expect(rsvp.errors[:status]).to be_present
    end

    it "enforces uniqueness per (meetup, user)" do
      create(:meetup_rsvp, meetup: meetup, user: user, status: "going")
      duplicate = build(:meetup_rsvp, meetup: meetup, user: user, status: "interested")
      expect(duplicate).not_to be_valid
    end
  end

  describe "counter_culture" do
    it "increments meetup.going_count when status is going" do
      expect { create(:meetup_rsvp, meetup: meetup, status: "going") }
        .to change { meetup.reload.going_count }.by(1)
        .and not_change { meetup.reload.interested_count }
    end

    it "increments meetup.interested_count when status is interested" do
      expect { create(:meetup_rsvp, meetup: meetup, status: "interested") }
        .to change { meetup.reload.interested_count }.by(1)
        .and not_change { meetup.reload.going_count }
    end

    it "decrements the right counter when an RSVP is destroyed" do
      rsvp = create(:meetup_rsvp, meetup: meetup, status: "going")
      expect { rsvp.destroy }.to change { meetup.reload.going_count }.by(-1)
    end

    it "moves the count when status changes" do
      rsvp = create(:meetup_rsvp, meetup: meetup, status: "going")
      expect { rsvp.update!(status: "interested") }
        .to change { meetup.reload.going_count }.by(-1)
        .and change { meetup.reload.interested_count }.by(1)
    end
  end
end

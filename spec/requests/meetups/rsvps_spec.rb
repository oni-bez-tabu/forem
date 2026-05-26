require "rails_helper"

RSpec.describe "Meetup RSVPs" do
  let(:meetup) { create(:meetup) }
  let(:user)   { create(:user) }

  describe "POST /meetups/:meetup_slug/rsvp" do
    context "without authentication" do
      it "redirects to a login flow" do
        post meetup_rsvp_path(meetup), params: { status: "going" }
        expect(response).to have_http_status(:redirect)
      end
    end

    context "as a signed-in user" do
      before { sign_in user }

      it "creates an RSVP" do
        expect { post meetup_rsvp_path(meetup), params: { status: "going" } }
          .to change(MeetupRsvp, :count).by(1)
        expect(MeetupRsvp.last).to have_attributes(meetup: meetup, user: user, status: "going")
      end

      it "increments the matching counter cache" do
        expect { post meetup_rsvp_path(meetup), params: { status: "going" } }
          .to change { meetup.reload.going_count }.by(1)
      end

      it "toggles off when the same status is posted twice" do
        post meetup_rsvp_path(meetup), params: { status: "going" }
        expect { post meetup_rsvp_path(meetup), params: { status: "going" } }
          .to change(MeetupRsvp, :count).by(-1)
      end

      it "changes status when a different value is posted" do
        post meetup_rsvp_path(meetup), params: { status: "going" }
        post meetup_rsvp_path(meetup), params: { status: "interested" }
        expect(MeetupRsvp.find_by(meetup: meetup, user: user).status).to eq("interested")
        expect(meetup.reload.going_count).to eq(0)
        expect(meetup.reload.interested_count).to eq(1)
      end

      it "404s for a meetup past the lifecycle window" do
        expired = create(:meetup, :expired_for_lists)
        expect { post meetup_rsvp_path(expired), params: { status: "going" } }
          .to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end

  describe "DELETE /meetups/:meetup_slug/rsvp" do
    before { sign_in user }

    it "removes the current user's RSVP" do
      create(:meetup_rsvp, meetup: meetup, user: user, status: "going")
      expect { delete meetup_rsvp_path(meetup) }
        .to change(MeetupRsvp, :count).by(-1)
    end
  end
end

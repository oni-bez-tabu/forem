require "rails_helper"

RSpec.describe "Admin::Meetups", type: :request do
  let(:admin)        { create(:user, :super_admin) }
  let(:regular_user) { create(:user) }

  describe "GET /admin/meetups" do
    context "as an admin" do
      before { sign_in admin }

      it "lists meetups across all lifecycle states (admin bypasses the 24h filter)" do
        upcoming = create(:meetup, name: "Upcoming Admin View")
        expired  = create(:meetup, :expired_for_lists, name: "Expired Admin View")
        draft    = create(:meetup, :unpublished, name: "Draft Admin View")

        get admin_meetups_path(scope: "all")
        expect(response).to have_http_status(:ok)
        expect(response.body).to include(upcoming.name, expired.name, draft.name)
      end

      it "filters by scope=unpublished" do
        published = create(:meetup, name: "Published Visible")
        draft     = create(:meetup, :unpublished, name: "Draft Hidden")
        get admin_meetups_path(scope: "unpublished")
        expect(response.body).to include(draft.name)
        expect(response.body).not_to include(published.name)
      end
    end

    context "as a regular user" do
      before { sign_in regular_user }

      it "denies access" do
        expect { get admin_meetups_path }.to raise_error(Pundit::NotAuthorizedError)
      end
    end
  end

  describe "POST /admin/meetups" do
    before { sign_in admin }

    let(:city) { create(:city) }

    let(:valid_attributes) do
      {
        name: "Czerwony Wieczór",
        venue_name: "Klub Hybrydy",
        venue_city_id: city.id,
        venue_address: "ul. Złota 7/9",
        start_at: 2.weeks.from_now.change(usec: 0),
        end_at: (2.weeks.from_now + 4.hours).change(usec: 0),
        banner_gradient: "dusk",
        description_link_type: "external",
        description_external_url: "https://example.com/wieczor",
        organizer_organization_id: create(:organization).id,
        is_published: true
      }
    end

    it "creates a meetup with sane defaults and a generated slug" do
      expect { post admin_meetups_path, params: { meetup: valid_attributes } }
        .to change(Meetup, :count).by(1)
      meetup = Meetup.last
      expect(meetup.slug).to start_with("czerwony-wieczor-")
      expect(meetup.created_by).to eq(admin)
      expect(response).to redirect_to(admin_meetups_path)
    end

    it "rejects invalid params" do
      expect {
        post admin_meetups_path, params: { meetup: valid_attributes.merge(end_at: 1.day.ago) }
      }.not_to change(Meetup, :count)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /admin/meetups/:id" do
    before { sign_in admin }
    let(:meetup) { create(:meetup, :unpublished) }

    it "publishes a draft" do
      patch admin_meetup_path(meetup), params: { meetup: { is_published: true } }
      expect(meetup.reload.is_published).to be(true)
    end
  end

  describe "DELETE /admin/meetups/:id" do
    before { sign_in admin }

    it "destroys the meetup" do
      meetup = create(:meetup)
      expect { delete admin_meetup_path(meetup) }.to change(Meetup, :count).by(-1)
    end
  end
end

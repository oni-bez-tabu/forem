require "rails_helper"

RSpec.describe "GET /meetups/:slug" do
  let(:meetup) { create(:meetup, name: "Visible Meetup") }

  it "renders 200 for a published, in-window meetup" do
    get meetup_path(meetup)
    expect(response).to have_http_status(:ok)
    expect(response.body).to include(meetup.name)
  end

  it "404s for unpublished meetups" do
    draft = create(:meetup, :unpublished)
    expect { get meetup_path(draft) }.to raise_error(ActiveRecord::RecordNotFound)
  end

  it "404s for meetups past the 24h lifecycle window" do
    expired = create(:meetup, :expired_for_lists)
    expect { get meetup_path(expired) }.to raise_error(ActiveRecord::RecordNotFound)
  end

  it "404s for unknown slug" do
    expect { get "/meetups/nope-nope" }.to raise_error(ActiveRecord::RecordNotFound)
  end

  describe "E10 declaration modal (?declare=1)" do
    let(:user) { create(:user) }

    before { sign_in user }

    context "with an active profile" do
      before do
        create(:matching_profile, :approved, user: user)
        create(:meetup_rsvp, meetup: meetup, user: user, status: "going")
      end

      it "renders the modal markup when ?declare=1 is set" do
        get meetup_path(meetup, declare: 1)
        expect(response.body).to include("declaration-modal-backdrop")
        expect(response.body).to include(I18n.t("matching.declarations.modal.title"))
      end

      it "does not render the modal without the query param" do
        get meetup_path(meetup)
        expect(response.body).not_to include("declaration-modal-backdrop")
      end
    end

    context "without a visible profile" do
      it "does not render the modal even when ?declare=1 is set" do
        get meetup_path(meetup, declare: 1)
        expect(response.body).not_to include("declaration-modal-backdrop")
      end
    end
  end
end

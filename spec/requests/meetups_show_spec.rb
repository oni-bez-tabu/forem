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

  describe "Preact declaration modal pack" do
    let(:user) { create(:user) }

    before { sign_in user }

    it "includes the matchingDeclarationModal pack on the meetup hub" do
      get meetup_path(meetup)
      expect(response.body).to include("matchingDeclarationModal")
    end
  end
end

require "rails_helper"

RSpec.describe "Matching::Declarations" do
  let(:user) { create(:user) }
  let(:meetup) { create(:meetup) }
  let(:profile) { create(:matching_profile, :approved, user: user) }
  let!(:rsvp) { create(:meetup_rsvp, meetup: meetup, user: user, status: "going") }

  let(:valid_params) do
    {
      meetup_matching_declaration: {
        intent_level: "open_to_meet",
        looking_for: %w[woman man],
        meetup_note: "Hi from the spec"
      }
    }
  end

  describe "GET /meetups/:slug/declaration/new" do
    context "with an active profile and an RSVP" do
      before do
        profile
        sign_in user
      end

      it "renders the form" do
        get new_meetup_declaration_path(meetup.slug)
        expect(response).to have_http_status(:ok)
        expect(response.body).to include(I18n.t("matching.declarations.submit"))
      end
    end

    context "without a Matching profile" do
      before { sign_in user }

      it "redirects to /matching" do
        get new_meetup_declaration_path(meetup.slug)
        expect(response).to redirect_to(matching_path)
      end
    end

    context "without an RSVP" do
      before do
        profile
        rsvp.destroy
        sign_in user
      end

      it "redirects back to the meetup with an alert" do
        get new_meetup_declaration_path(meetup.slug)
        expect(response).to redirect_to(meetup_path(meetup))
      end
    end
  end

  describe "POST /meetups/:slug/declaration" do
    before do
      profile
      sign_in user
    end

    it "creates a declaration" do
      expect { post meetup_declaration_path(meetup.slug), params: valid_params }
        .to change(MeetupMatchingDeclaration, :count).by(1)
      expect(response).to redirect_to(meetup_path(meetup))
    end

    it "rejects an invalid intent" do
      bad = valid_params.deep_dup
      bad[:meetup_matching_declaration][:intent_level] = "bogus"
      expect { post meetup_declaration_path(meetup.slug), params: bad }
        .not_to change(MeetupMatchingDeclaration, :count)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /meetups/:slug/declaration" do
    let!(:declaration) { create(:meetup_matching_declaration, meetup: meetup, matching_profile: profile) }
    before { sign_in user }

    it "updates the declaration" do
      patch meetup_declaration_path(meetup.slug), params: {
        meetup_matching_declaration: { intent_level: "just_vibe", meetup_note: "updated" }
      }
      declaration.reload
      expect(declaration.intent_level).to eq("just_vibe")
      expect(declaration.meetup_note).to eq("updated")
    end
  end

  describe "DELETE /meetups/:slug/declaration" do
    let!(:declaration) { create(:meetup_matching_declaration, meetup: meetup, matching_profile: profile) }
    before { sign_in user }

    it "removes the declaration" do
      expect { delete meetup_declaration_path(meetup.slug) }
        .to change(MeetupMatchingDeclaration, :count).by(-1)
    end
  end
end

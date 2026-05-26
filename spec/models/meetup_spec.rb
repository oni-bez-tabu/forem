require "rails_helper"

RSpec.describe Meetup do
  describe "validations" do
    it "is valid with default factory" do
      expect(build(:meetup)).to be_valid
    end

    it "requires name" do
      meetup = build(:meetup, name: nil)
      expect(meetup).not_to be_valid
      expect(meetup.errors[:name]).to be_present
    end

    it "requires end_at after start_at" do
      meetup = build(:meetup, start_at: 1.day.from_now, end_at: 1.hour.from_now)
      expect(meetup).not_to be_valid
      expect(meetup.errors[:end_at]).to include("must be after start_at")
    end

    it "requires exactly one organizer (user XOR organization)" do
      both = build(:meetup, organizer_organization: build(:organization))
      neither = build(:meetup, organizer_user: nil)
      expect(both).not_to be_valid
      expect(neither).not_to be_valid
    end

    it "accepts an organization-only organizer" do
      expect(build(:meetup, :organized_by_organization)).to be_valid
    end

    it "requires description_external_url when description_link_type is external" do
      meetup = build(:meetup, description_external_url: nil)
      expect(meetup).not_to be_valid
      expect(meetup.errors[:description_external_url]).to be_present
    end

    it "requires description_internal_post when description_link_type is internal" do
      meetup = build(:meetup, :with_internal_description, description_internal_post: nil)
      expect(meetup).not_to be_valid
      expect(meetup.errors[:description_internal_post_id]).to be_present
    end

    it "rejects mixing internal post and external url" do
      meetup = build(:meetup, :with_internal_description, description_external_url: "https://example.com")
      expect(meetup).not_to be_valid
    end

    it "rejects invalid banner_gradient" do
      meetup = build(:meetup, banner_gradient: "neon")
      expect(meetup).not_to be_valid
      expect(meetup.errors[:banner_gradient]).to be_present
    end

    it "rejects invalid description_link_type" do
      meetup = build(:meetup, description_link_type: "other")
      expect(meetup).not_to be_valid
    end
  end

  describe "slug generation" do
    it "auto-generates slug from name + start date on create" do
      meetup = create(:meetup, name: "Czerwony Wieczór", start_at: Time.zone.local(2026, 6, 14, 19))
      expect(meetup.slug).to eq("czerwony-wieczor-2026-06-14")
    end

    it "honors explicit slug" do
      meetup = create(:meetup, slug: "custom-slug-2026")
      expect(meetup.slug).to eq("custom-slug-2026")
    end

    it "enforces slug uniqueness" do
      create(:meetup, slug: "duplicate-2026-06-14")
      expect { create(:meetup, slug: "duplicate-2026-06-14") }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "exposes slug as URL param" do
      meetup = create(:meetup)
      expect(meetup.to_param).to eq(meetup.slug)
    end
  end

  describe "scopes" do
    let!(:upcoming_published) { create(:meetup) }
    let!(:recently_ended)     { create(:meetup, :recently_ended) }
    let!(:expired_published)  { create(:meetup, :expired_for_lists) }
    let!(:unpublished)        { create(:meetup, :unpublished) }

    it "visible_in_lists includes published meetups within the 24h grace window" do
      expect(Meetup.visible_in_lists).to include(upcoming_published, recently_ended)
      expect(Meetup.visible_in_lists).not_to include(expired_published, unpublished)
    end

    it "upcoming_first orders by start_at ascending" do
      slugs = Meetup.upcoming_first.pluck(:slug)
      starts = Meetup.upcoming_first.pluck(:start_at)
      expect(starts).to eq(starts.sort)
      expect(slugs).to be_present
    end
  end

  describe "#organizer" do
    it "returns the user organizer when set" do
      user = create(:user)
      meetup = create(:meetup, organizer_user: user)
      expect(meetup.organizer).to eq(user)
    end

    it "returns the organization organizer when set" do
      org = create(:organization)
      meetup = create(:meetup, :organized_by_organization, organizer_organization: org)
      expect(meetup.organizer).to eq(org)
    end
  end

  describe "#expired_for_lists?" do
    it "is false within the 24h grace window" do
      expect(create(:meetup, :recently_ended).expired_for_lists?).to be(false)
    end

    it "is true past the grace window" do
      expect(create(:meetup, :expired_for_lists).expired_for_lists?).to be(true)
    end
  end
end

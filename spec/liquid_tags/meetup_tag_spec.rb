require "rails_helper"

RSpec.describe MeetupTag, type: :liquid_tag do
  let(:meetup) { create(:meetup, name: "Czerwony Wieczór") }

  before { Liquid::Template.register_tag("meetup", described_class) }

  def parse(slug)
    Liquid::Template.parse("{% meetup #{slug} %}")
  end

  it "renders the meetup name and a link to the meetup hub" do
    output = parse(meetup.slug).render
    expect(output).to include("Czerwony Wieczór")
    expect(output).to include("/wydarzenia/#{meetup.slug}")
  end

  it "renders the upcoming state when start_at is in the future" do
    create(:meetup, slug: "upcoming-meetup", start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
    output = parse("upcoming-meetup").render
    expect(output).to include(I18n.t("meetups.widget.state.upcoming"))
  end

  it "renders the active state during the 24h grace window after end_at" do
    create(:meetup, :recently_ended, slug: "active-meetup")
    output = parse("active-meetup").render
    expect(output).to include(I18n.t("meetups.widget.state.active"))
  end

  it "renders the expired state past end_at + 24h" do
    create(:meetup, :expired_for_lists, slug: "expired-meetup")
    output = parse("expired-meetup").render
    expect(output).to include(I18n.t("meetups.widget.state.expired"))
    # CTA disappears in expired state
    expect(output).not_to include(I18n.t("meetups.widget.cta"))
  end

  it "raises when slug does not match any meetup" do
    expect do
      parse("does-not-exist")
    end.to raise_error(StandardError, /not found|nie znaleziono|introuvable|não encontrado/i)
  end

  it "raises on invalid slug syntax" do
    expect { parse("Invalid Slug!") }.to raise_error(StandardError)
  end
end

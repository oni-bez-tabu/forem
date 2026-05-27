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
    expect(output).to include("/meetups/#{meetup.slug}")
  end

  it "renders an upcoming meetup with day/month and banner area" do
    upcoming = create(:meetup, name: "Upcoming Meet", start_at: 2.days.from_now, end_at: 2.days.from_now + 2.hours)
    output = parse(upcoming.slug).render
    expect(output).to include("Upcoming Meet")
    expect(output).to include(upcoming.start_at.day.to_s)
    expect(output).not_to include(I18n.t("meetups.widget.state.expired"))
  end

  it "renders an active meetup (within 24h grace) without the expired label" do
    active = create(:meetup, :recently_ended, name: "Active Meet")
    output = parse(active.slug).render
    expect(output).to include("Active Meet")
    expect(output).not_to include(I18n.t("meetups.widget.state.expired"))
  end

  it "labels an expired meetup with the expired state" do
    expired = create(:meetup, :expired_for_lists, name: "Expired Meet")
    output = parse(expired.slug).render
    expect(output).to include(I18n.t("meetups.widget.state.expired"))
  end

  it "raises when slug does not match any meetup" do
    expect do
      parse("does-not-exist")
    end.to raise_error(StandardError, /not found|nie znaleziono|introuvable|não encontrado/i)
  end

  it "raises on invalid slug syntax" do
    expect { parse("Invalid Slug!") }.to raise_error(StandardError)
  end

  it "accepts a full local URL (UnifiedEmbed registration shape)" do
    url = "https://nietabu.pl/meetups/#{meetup.slug}"
    output = Liquid::Template.parse("{% meetup #{url} %}").render
    expect(output).to include(meetup.name)
  end
end

require "rails_helper"

RSpec.describe MatchingWelcome do
  let(:meetup) { create(:meetup) }
  let(:sender_profile) { create(:matching_profile, :approved) }
  let(:receiver_profile) { create(:matching_profile, :approved) }

  describe "validations" do
    it "is valid with sender, receiver, meetup, sent_at" do
      welcome = build(:matching_welcome,
                      sender_profile: sender_profile,
                      receiver_profile: receiver_profile,
                      meetup: meetup)
      expect(welcome).to be_valid
    end

    it "requires sent_at" do
      welcome = build(:matching_welcome, sent_at: nil)
      expect(welcome).not_to be_valid
      expect(welcome.errors[:sent_at]).to be_present
    end

    it "blocks duplicate (sender, receiver) pairs across meetups" do
      first_meetup = create(:meetup)
      second_meetup = create(:meetup)
      create(:matching_welcome,
             sender_profile: sender_profile,
             receiver_profile: receiver_profile,
             meetup: first_meetup)

      duplicate = build(:matching_welcome,
                        sender_profile: sender_profile,
                        receiver_profile: receiver_profile,
                        meetup: second_meetup)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:sender_profile_id]).to be_present
    end

    it "rejects self-welcome" do
      welcome = build(:matching_welcome,
                      sender_profile: sender_profile,
                      receiver_profile: sender_profile,
                      meetup: meetup)
      expect(welcome).not_to be_valid
      expect(welcome.errors[:receiver_profile_id]).to be_present
    end
  end

  describe ".exists_between?" do
    it "returns true when welcome already exists" do
      create(:matching_welcome,
             sender_profile: sender_profile,
             receiver_profile: receiver_profile,
             meetup: meetup)
      expect(described_class.exists_between?(sender_profile, receiver_profile)).to be(true)
    end

    it "returns false when no welcome between this pair" do
      expect(described_class.exists_between?(sender_profile, receiver_profile)).to be(false)
    end

    it "is directional — A→B does not satisfy B→A" do
      create(:matching_welcome,
             sender_profile: sender_profile,
             receiver_profile: receiver_profile,
             meetup: meetup)
      expect(described_class.exists_between?(receiver_profile, sender_profile)).to be(false)
    end
  end

  describe ".render_body" do
    it "fills the template with sender's event-scoped profile URL" do
      body = described_class.render_body(
        sender_profile: sender_profile,
        meetup: meetup,
        host: "nietabu.pl",
      )
      expect(body).to include("https://nietabu.pl/m/#{meetup.slug}/#{sender_profile.id}")
      expect(body).to include("Mój profil Matching:")
    end
  end

  describe "destroy cascades" do
    it "is destroyed when sender_profile is destroyed" do
      welcome = create(:matching_welcome,
                       sender_profile: sender_profile,
                       receiver_profile: receiver_profile,
                       meetup: meetup)
      sender_profile.destroy
      expect(described_class.find_by(id: welcome.id)).to be_nil
    end

    it "is destroyed when receiver_profile is destroyed" do
      welcome = create(:matching_welcome,
                       sender_profile: sender_profile,
                       receiver_profile: receiver_profile,
                       meetup: meetup)
      receiver_profile.destroy
      expect(described_class.find_by(id: welcome.id)).to be_nil
    end

    it "is destroyed when meetup is destroyed" do
      welcome = create(:matching_welcome,
                       sender_profile: sender_profile,
                       receiver_profile: receiver_profile,
                       meetup: meetup)
      meetup.destroy
      expect(described_class.find_by(id: welcome.id)).to be_nil
    end
  end
end

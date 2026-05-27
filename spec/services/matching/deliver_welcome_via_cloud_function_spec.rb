require "rails_helper"

RSpec.describe Matching::DeliverWelcomeViaCloudFunction do
  let(:welcome) { create(:matching_welcome) }
  let(:body) { "Hej, planujemy ...\nMój profil: https://nietabu.pl/m/foo/1" }

  context "when MATCHING_WELCOME_CLOUD_FUNCTION_URL is unset" do
    before do
      allow(ApplicationConfig).to receive(:[]).and_call_original
      allow(ApplicationConfig).to receive(:[]).with("MATCHING_WELCOME_CLOUD_FUNCTION_URL").and_return(nil)
    end

    it "returns stubbed status without hitting HTTP" do
      expect(HTTParty).not_to receive(:post)
      result = described_class.call(welcome: welcome, body: body)
      expect(result).to eq(ok: true, status: :stubbed)
    end
  end

  context "when URL is set and CF responds 2xx" do
    let(:cf_url) { "https://cf.example/welcome" }

    before do
      allow(ApplicationConfig).to receive(:[]).and_call_original
      allow(ApplicationConfig).to receive(:[]).with("MATCHING_WELCOME_CLOUD_FUNCTION_URL").and_return(cf_url)
    end

    it "POSTs JSON payload and returns delivered" do
      stub = instance_double(HTTParty::Response, success?: true, code: 200)
      expect(HTTParty).to receive(:post).with(
        cf_url,
        hash_including(
          headers: { "Content-Type" => "application/json" },
          timeout: described_class::TIMEOUT_SECONDS,
        ),
      ) do |_url, opts|
        payload = JSON.parse(opts[:body])
        expect(payload).to include(
          "sender_user_id" => welcome.sender_profile.user_id,
          "receiver_user_id" => welcome.receiver_profile.user_id,
          "body" => body,
          "meetup_slug" => welcome.meetup.slug,
          "welcome_id" => welcome.id,
        )
        stub
      end

      result = described_class.call(welcome: welcome, body: body)
      expect(result).to eq(ok: true, status: :delivered)
    end
  end

  context "when CF responds non-2xx" do
    before do
      allow(ApplicationConfig).to receive(:[]).and_call_original
      allow(ApplicationConfig).to receive(:[]).with("MATCHING_WELCOME_CLOUD_FUNCTION_URL").and_return("https://cf.example/welcome")
      allow(HTTParty).to receive(:post).and_return(instance_double(HTTParty::Response, success?: false, code: 502))
    end

    it "returns failed status with error tag" do
      result = described_class.call(welcome: welcome, body: body)
      expect(result[:ok]).to be(false)
      expect(result[:status]).to eq(:failed)
      expect(result[:error]).to eq("cloud_function_returned_502")
    end
  end

  context "when HTTParty raises" do
    before do
      allow(ApplicationConfig).to receive(:[]).and_call_original
      allow(ApplicationConfig).to receive(:[]).with("MATCHING_WELCOME_CLOUD_FUNCTION_URL").and_return("https://cf.example/welcome")
      allow(HTTParty).to receive(:post).and_raise(Net::ReadTimeout, "boom")
    end

    it "returns failed status with exception message" do
      result = described_class.call(welcome: welcome, body: body)
      expect(result[:ok]).to be(false)
      expect(result[:status]).to eq(:failed)
      expect(result[:error]).to include("boom")
    end
  end
end

require "rails_helper"

RSpec.describe "Messages::WebhooksController" do
  let(:chat_webhook_token) { "test-webhook-token" }
  let(:headers) do
    {
      "Authorization" => "Bearer #{chat_webhook_token}",
      "X-Chat-SDK-Token" => chat_webhook_token,
      "Content-Type" => "multipart/form-data"
    }
  end
  let(:image) do
    Rack::Test::UploadedFile.new(
      Rails.root.join("spec/support/fixtures/images/image1.jpeg"),
      "image/jpeg",
    )
  end
  let(:bad_image) do
    Rack::Test::UploadedFile.new(
      Rails.root.join("spec/support/fixtures/images/bad-image.jpg"),
      "image/jpeg",
    )
  end

  before do
    allow(ApplicationConfig).to receive(:[]).with("CHAT_WEBHOOK_TOKEN").and_return(chat_webhook_token)
  end

  describe "POST /messages/webhooks/upload" do
    let(:user) { create(:user) }
    let(:authorizer) { instance_double(Authorizer::RoleBasedQueries) }

    before do
      allow(Authorizer).to receive(:for).with(user: user).and_return(authorizer)
      allow(authorizer).to receive(:trusted?).and_return(false)
      allow(authorizer).to receive(:spam_or_suspended?).and_return(false)
      allow(authorizer).to receive(:warned?).and_return(false)
      allow(authorizer).to receive(:comment_suspended?).and_return(false)
      allow(authorizer).to receive(:limited?).and_return(false)
    end

    context "when token is invalid" do
      let(:invalid_headers) do
        {
          "Authorization" => "Bearer wrong-token",
          "Content-Type" => "multipart/form-data"
        }
      end

      it "responds with 401" do
        post "/messages/webhooks/upload", params: { userId: user.id, file: image }, headers: invalid_headers
        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body["error"]).to eq("Unauthorized")
      end
    end

    context "when userId is missing" do
      it "responds with 400" do
        post "/messages/webhooks/upload", params: { file: image }, headers: headers
        expect(response).to have_http_status(:bad_request)
        expect(response.parsed_body["error"]).to eq("userId is required")
      end
    end

    context "when user does not exist" do
      it "responds with 404" do
        post "/messages/webhooks/upload", params: { userId: 999_999, file: image }, headers: headers
        expect(response).to have_http_status(:not_found)
        expect(response.parsed_body["error"]).to eq("User not found")
      end
    end

    context "when user does not have valid reputation" do
      before do
        allow(authorizer).to receive(:spam_or_suspended?).and_return(true)
      end

      it "responds with 403" do
        post "/messages/webhooks/upload", params: { userId: user.id, file: image }, headers: headers
        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body["error"]).to eq("User does not have required reputation")
      end
    end

    context "when user is trusted" do
      before do
        allow(authorizer).to receive(:trusted?).and_return(true)
      end

      it "allows upload" do
        post "/messages/webhooks/upload", params: { userId: user.id, file: image }, headers: headers
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["url"]).to be_present
      end
    end

    context "when user is in good standing" do
      it "allows upload" do
        post "/messages/webhooks/upload", params: { userId: user.id, file: image }, headers: headers
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["url"]).to be_present
      end
    end

    context "when file is missing" do
      it "responds with 422" do
        post "/messages/webhooks/upload", params: { userId: user.id }, headers: headers
        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.parsed_body["error"]).to eq("File is required")
      end
    end

    context "when file is invalid" do
      it "responds with 422 for bad image" do
        post "/messages/webhooks/upload", params: { userId: user.id, file: bad_image }, headers: headers
        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.parsed_body["error"]).to be_present
      end
    end

    context "when rate limit is exceeded" do
      let(:cache_store) { ActiveSupport::Cache.lookup_store(:redis_cache_store) }
      let(:cache) { Rails.cache }
      let(:cache_key) { "#{user.id}_image_upload" }

      before do
        allow(Rails).to receive(:cache).and_return(cache_store)
        # Set rate limit to 9 and upload 10 times
        allow(Settings::RateLimit).to receive(:image_upload).and_return(9)
        10.times do
          post "/messages/webhooks/upload", params: { userId: user.id, file: image }, headers: headers
        end
      end

      it "responds with 429" do
        post "/messages/webhooks/upload", params: { userId: user.id, file: image }, headers: headers
        expect(response).to have_http_status(:too_many_requests)
      end
    end

    context "when upload is successful" do
      it "returns JSON with url" do
        post "/messages/webhooks/upload", params: { userId: user.id, file: image }, headers: headers
        expect(response).to have_http_status(:ok)
        expect(response.media_type).to eq("application/json")
        expect(response.parsed_body["url"]).to be_present
        expect(response.parsed_body["url"]).to match(%r{/uploads/articles/.+})
      end
    end
  end
end

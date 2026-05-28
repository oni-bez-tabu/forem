require "rails_helper"

RSpec.describe "Api::V1::Meetups::Boosts" do
  let(:v1_headers) do
    { "content-type" => "application/json", "Accept" => "application/vnd.forem.api-v1+json" }
  end
  let(:api_secret) { create(:api_secret) }
  let(:user) { api_secret.user }
  let(:auth_header) { v1_headers.merge({ "api-key" => api_secret.secret }) }
  let(:meetup) { create(:meetup) }
  let(:path) { api_meetup_boost_path(slug: meetup.slug) }

  it "creates a full_post article with the meetup embed and returns its path" do
    expect do
      post path,
           params: { body: "Idę na ten event, kto się dołącza?" }.to_json,
           headers: auth_header
    end.to change(Article, :count).by(1)
    expect(response).to have_http_status(:created)
    body = response.parsed_body
    expect(body["ok"]).to be(true)
    expect(body["path"]).to be_present

    article = Article.last
    expect(article.body_markdown).to include("{% embed ")
    expect(article.body_markdown).to include(meetup.slug)
  end

  it "401s without auth" do
    post path, params: { body: "hello" }.to_json, headers: v1_headers
    expect(response).to have_http_status(:unauthorized)
  end

  it "422s for an empty body" do
    post path, params: { body: "   " }.to_json, headers: auth_header
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it "404s for an expired meetup" do
    expired = create(:meetup, :expired_for_lists)
    post api_meetup_boost_path(slug: expired.slug),
         params: { body: "hi" }.to_json,
         headers: auth_header
    expect(response).to have_http_status(:not_found)
  end
end

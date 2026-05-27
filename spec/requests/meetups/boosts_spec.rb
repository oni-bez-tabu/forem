require "rails_helper"

RSpec.describe "POST /meetups/:slug/boost" do
  let(:user) { create(:user) }
  let(:meetup) { create(:meetup) }

  before { sign_in user }

  def post_boost(body:)
    post boost_meetup_path(meetup.slug),
         params: { body: body }.to_json,
         headers: { "Content-Type" => "application/json", "Accept" => "application/json" }
  end

  it "creates a published status article that embeds the meetup widget" do
    post_boost(body: "Wybieram się, kto chętny?")
    if response.status != 201
      raise "boost create failed: status=#{response.status}, body=#{response.body}"
    end

    expect(response).to have_http_status(:created)
    expect(Article.where(user_id: user.id).count).to eq(1)

    article = Article.last
    expect(article.user_id).to eq(user.id)
    expect(article.published).to be(true)
    expect(article.type_of).to eq("full_post")
    expect(article.title).to include("Wybieram")
    expect(article.body_markdown).to include("Wybieram się, kto chętny?")
    expect(article.body_markdown).to match(%r{\{% embed https?://[^/]+/meetups/#{meetup.slug} %\}})

    json = response.parsed_body
    expect(json["path"]).to eq(article.path)
  end

  it "422s on empty body (no prefill allowed but body is required)" do
    expect do
      post_boost(body: "   ")
    end.not_to change(Article, :count)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.parsed_body["error"]).to eq("body_required")
  end

  it "404s on unknown meetup slug" do
    expect do
      post "/meetups/does-not-exist/boost",
           params: { body: "x" }.to_json,
           headers: { "Content-Type" => "application/json", "Accept" => "application/json" }
    end.to raise_error(ActiveRecord::RecordNotFound)
  end

  it "404s on a meetup that has expired from public lists (24h after end_at)" do
    expired = create(:meetup, :expired_for_lists)
    expect do
      post "/meetups/#{expired.slug}/boost",
           params: { body: "x" }.to_json,
           headers: { "Content-Type" => "application/json", "Accept" => "application/json" }
    end.to raise_error(ActiveRecord::RecordNotFound)
  end

  it "rejects unauthenticated requests" do
    sign_out user
    post_boost(body: "x")
    # JSON requests get 401 from devise (not a redirect to login)
    expect(response).to have_http_status(:unauthorized)
  end
end

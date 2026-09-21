# spec/requests/private_forem_spec.rb

require "rails_helper"

RSpec.describe "Private Forem with public posts" do
  let(:user) { create(:user) }
  let(:article) { create(:article, user: user) }

  before do
    allow(Settings::UserExperience).to receive(:public).and_return(false)
  end

  describe "what an anonymous visitor can still reach" do
    it "serves a post linked from the outside" do
      get article.path

      expect(response).to have_http_status(:ok)
      expect(response.body).to include CGI.escapeHTML(article.title)
    end

    it "serves a user profile" do
      get "/#{user.username}"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include CGI.escapeHTML(user.name)
    end

    it "serves the comments under a post" do
      comment = create(:comment, commentable: article, user: user)

      get "#{article.path}/comments"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include(comment.processed_html)
    end

    it "serves a static page such as the terms" do
      page = create(:page, title: "Regulamin", slug: "regulamin", is_top_level_path: true)

      get "/#{page.slug}"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include CGI.escapeHTML(page.title)
    end

    it "serves the RSS feed" do
      article

      get "/feed"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include CGI.escapeHTML(article.title)
    end

    it "serves the sitemap so that search engines keep indexing posts" do
      article.update_columns(score: 1)

      get "/sitemap-posts.xml"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include(article.path)
    end

    it "no longer advertises tag sitemaps, which now sit behind the login" do
      get "/sitemap-index.xml"

      expect(response.body).not_to include("sitemap-tags.xml")
    end

    it "does not serve a tag sitemap" do
      get "/sitemap-tags.xml"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "what an anonymous visitor is kept out of" do
    it "shows the landing page instead of the home feed" do
      create(:page, title: "This is a landing page!", landing_page: true)

      get root_path

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("This is a landing page!")
      expect(response.body).not_to include CGI.escapeHTML(article.title)
    end

    it "sends tag pages to the sign up screen" do
      tag = create(:tag)

      get "/t/#{tag.name}"

      expect(response).to redirect_to(sign_up_path)
    end

    it "sends search to the sign up screen" do
      get "/search"

      expect(response).to redirect_to(sign_up_path)
    end

    it "remembers where the visitor was headed" do
      tag = create(:tag)

      get "/t/#{tag.name}"

      expect(session["user_return_to"]).to end_with("/t/#{tag.name}")
    end

    it "hides the search field from the header" do
      get article.path

      expect(response.body).not_to include('id="header-search"')
    end
  end

  describe "when the Forem is public" do
    before do
      allow(Settings::UserExperience).to receive(:public).and_return(true)
    end

    it "still serves the home feed" do
      article

      get root_path

      expect(response).to have_http_status(:ok)
    end

    it "still shows the search field" do
      get root_path

      expect(response.body).to include('id="header-search"')
    end
  end

  describe "when the visitor is signed in" do
    before { sign_in user }

    it "serves the home feed" do
      get root_path

      expect(response).to have_http_status(:ok)
    end

    it "serves tag pages" do
      tag = create(:tag)

      get "/t/#{tag.name}"

      expect(response).to have_http_status(:ok)
    end
  end
end

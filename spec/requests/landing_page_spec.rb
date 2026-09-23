# spec/requests/landing_page_spec.rb

require "rails_helper"

RSpec.describe "Landing page" do
  before do
    allow(Settings::UserExperience).to receive(:public).and_return(false)
  end

  describe "GET / as an anonymous visitor" do
    it "renders the landing instead of the feed" do
      get root_path

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("Miejsce dla")
      expect(response.body).to include("#żyjebeztabu")
    end

    it "points every call to action at the sign up screen" do
      get root_path

      expect(response.body).to include(%(href="#{sign_up_path}"))
      expect(response.body).to include(%(href="#{sign_up_path(state: 'new-user')}"))
      expect(response.body).not_to include("data-preview")
    end

    it "renders the lists server side so that crawlers see them" do
      get root_path

      # z domyslnego config/landing_data.json
      expect(response.body).to include("nefretette")
      expect(response.body).to include("Znajdź swój temat")
      expect(response.body).to include("/t/relacje")
    end

    it "renders the full topic grid, including the faded teasers" do
      get root_path

      # 8 klikalnych + 4 wyblakle zajawki. Przy brakujacych kafelkach karta zaproszenia
      # wychodzi poza swoj kontener i nachodzi na sekcje wydarzen.
      expect(response.body.scan(/class="topic-card/).size).to eq(12)
      expect(response.body.scan(/<a class="topic-card/).size).to eq(8)
      expect(response.body.scan(/<div class="topic-card topic-faded/).size).to eq(4)
      expect(response.body).to include("topics-veil")
      expect(response.body).to include("topics-invite")
    end

    it "carries SEO metadata" do
      get root_path

      expect(response.body).to include(%(<link rel="canonical"))
      expect(response.body).to include(%(property="og:title"))
      expect(response.body).to include(%(name="robots" content="index, follow))
      expect(response.body).to include("application/ld+json")
    end

    it "is cacheable at the edge even though the Forem is private" do
      get root_path

      expect(response.headers["Surrogate-Control"]).to include("max-age=")
      expect(response.headers["Surrogate-Key"]).to eq("landing_page")
      expect(response.headers["Cache-Control"]).to eq("public, no-cache")
    end

    it "ships no base64 images" do
      get root_path

      expect(response.body).not_to include("data:image/png;base64")
    end
  end

  describe "content editable from the admin" do
    it "prefers the landing-data page over the bundled defaults" do
      create(:page, slug: "landing-data", template: "json", body_json: {
               "posts" => [], "profiles" => [],
               "topics" => [{ "css_class" => "topic-card", "slug" => "wlasny",
                              "label" => "wlasny", "description" => "Temat z admina." }]
             })

      get root_path

      expect(response.body).to include("Temat z admina.")
      expect(response.body).not_to include("Rozmowy o relacjach i komunikacji.")
    end

    it "falls back to the bundled defaults when the page is absent" do
      get root_path

      expect(response.body).to include("Rozmowy o relacjach i komunikacji.")
    end
  end

  describe "cache busting" do
    it "drops the cached landing when the data page changes" do
      bust = instance_double(EdgeCache::Bust)
      allow(EdgeCache::Bust).to receive(:new).and_return(bust)
      allow(bust).to receive(:call)

      EdgeCache::BustPage.call("landing-data")

      expect(bust).to have_received(:call).with("/")
    end

    it "leaves the landing alone for unrelated pages" do
      bust = instance_double(EdgeCache::Bust)
      allow(EdgeCache::Bust).to receive(:new).and_return(bust)
      allow(bust).to receive(:call)

      EdgeCache::BustPage.call("terms")

      expect(bust).not_to have_received(:call).with("/")
    end
  end

  describe "theme of the sign up screen" do
    it "renders dark in a browser" do
      get sign_up_path

      expect(response.body).to include("dark-theme")
    end

    it "stays light inside the mobile app" do
      get sign_up_path, headers: { "HTTP_USER_AGENT" => "Mozilla/5.0 (iPhone) ForemWebView/1" }

      expect(response.body).not_to include("dark-theme")
    end

    it "stays light for a signed in user, who picks their own theme" do
      sign_in create(:user)

      get sign_up_path

      expect(response.body).not_to include("dark-theme")
    end
  end
end

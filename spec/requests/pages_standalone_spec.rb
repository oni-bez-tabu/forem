require "rails_helper"

RSpec.describe "Pages with the standalone template" do
  let(:html) do
    "<!doctype html><html lang=\"pl\"><head><meta charset=\"utf-8\"><title>Strefa Pary</title></head>" \
      "<body><div id=\"root\">Ładowanie…</div><script type=\"module\" src=\"https://cdn.example/loader.js\"></script></body></html>"
  end

  after { RequestStore.store[:subforem_id] = nil }

  it "is an allowed template" do
    expect(Page::TEMPLATE_OPTIONS).to include("standalone")
    expect(build(:page, template: "standalone", body_markdown: nil, body_html: html)).to be_valid
  end

  it "serves only the body html at the top-level path (no Forem layout)" do
    page = create(:page, slug: "strefa-pary", template: "standalone", body_markdown: nil,
                         body_html: html, is_top_level_path: true)
    get "/#{page.slug}"
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("text/html")
    expect(response.body).to eq(html)
    expect(response.body).not_to include("crayons-header")
    expect(response.body).not_to include("stories-show")
  end

  it "serves only the body html under /page/:slug" do
    page = create(:page, template: "standalone", body_markdown: nil, body_html: html)
    get "/page/#{page.slug}"
    expect(response).to have_http_status(:ok)
    expect(response.body).to eq(html)
  end
end

# Renders a Page with the "standalone" template: the body HTML is the whole document,
# with no Forem layout, header, footer or JavaScript.
module StandalonePageRenderable
  extend ActiveSupport::Concern

  private

  # rubocop:disable Rails/OutputSafety
  def render_standalone_page
    render html: @page.processed_html.to_s.html_safe, layout: false, content_type: "text/html"
  end
  # rubocop:enable Rails/OutputSafety
end

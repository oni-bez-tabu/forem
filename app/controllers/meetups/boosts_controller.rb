module Meetups
  # POST /meetups/:meetup_slug/boost — creates a Forem full_post article that
  # embeds the meetup widget via `{% meetup <slug> %}`. SPEC §8.5: no prefill,
  # user fully writes the body, widget is appended automatically. Title is
  # derived from the first line of the body (Forem requires non-blank title).
  class BoostsController < ApplicationController
    before_action :authenticate_user!
    before_action :load_meetup

    TITLE_MAX = 120
    def create
      body = params[:body].to_s.strip
      if body.blank?
        return render json: { status: "error", error: "body_required" },
                      status: :unprocessable_entity
      end

      # Uses {% embed <url> %} (UnifiedEmbed) instead of {% meetup <slug> %}
      # so the embedded widget mirrors the convention Forem uses for any other
      # local content link (articles, comments, etc.). UnifiedEmbed::Registry
      # routes the URL to MeetupTag via REGISTRY_REGEXP.
      body_with_widget = "#{body}\n\n{% embed #{meetup_url(@meetup)} %}\n"
      title = derive_title(body)

      article = Articles::Creator.call(current_user, {
                                         title: title,
                                         body_markdown: body_with_widget,
                                         published: true
                                       })

      if article.persisted?
        render json: {
          status: "ok",
          article_id: article.id,
          path: article.path
        }, status: :created
      else
        render json: { status: "error", errors: article.errors.full_messages },
               status: :unprocessable_entity
      end
    end

    private

    def load_meetup
      slug = params[:slug] || params[:meetup_slug]
      @meetup = Meetup.visible_in_lists.find_by(slug: slug)
      raise ActiveRecord::RecordNotFound unless @meetup
    end

    # Forem requires a title for full_post articles. Derive one from the first
    # line of the user-written body, truncating to TITLE_MAX. If the body is
    # too terse (no readable first line), fall back to the meetup name.
    def derive_title(body)
      first_line = body.lines.first.to_s.strip
      candidate = first_line.length > TITLE_MAX ? "#{first_line[0, TITLE_MAX - 1]}…" : first_line
      candidate.presence || @meetup.name
    end
  end
end

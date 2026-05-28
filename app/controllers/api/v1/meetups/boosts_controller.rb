module Api
  module V1
    module Meetups
      # POST /api/meetups/:slug/boost  { body: "user-typed text" }
      #
      # Creates a regular nietabu post (`full_post` article) with the user's
      # body text followed by a `{% embed http://host/meetups/<slug> %}`
      # liquid tag (canonical Forem embed). The response includes the
      # resulting article path so the client can navigate to it.
      class BoostsController < ApiController
        before_action :authenticate!
        before_action :set_meetup

        def create
          body = params[:body].to_s.strip
          return error_unprocessable_entity("body_required") if body.blank?

          embed_url = meetup_url(@meetup, host: request.host_with_port, protocol: request.protocol)
          title = derive_title(body)
          markdown = "#{body}\n\n{% embed #{embed_url} %}"

          article = Articles::Creator.call(@user, {
            title: title,
            body_markdown: markdown,
            type_of: "full_post",
            published: true,
          })

          if article.persisted?
            render json: { ok: true, path: article.path }, status: :created
          else
            error_unprocessable_entity(article.errors.full_messages.to_sentence)
          end
        end

        private

        def set_meetup
          @meetup = Meetup.visible_in_lists.find_by(slug: params[:slug])
          error_not_found unless @meetup
        end

        def derive_title(body)
          first_line = body.lines.first.to_s.strip
          return @meetup.name if first_line.blank?

          first_line.truncate(120, separator: " ")
        end
      end
    end
  end
end

module Api
  module NotificationsController
    extend ActiveSupport::Concern

    DEFAULT_PER_PAGE = 30
    private_constant :DEFAULT_PER_PAGE

    def index
      authenticate_with_api_key!
      return error_unauthorized unless @user.trusted? || @user.any_admin?

      per_page = (params[:per_page] || DEFAULT_PER_PAGE).to_i
      page = (params[:page] || 1).to_i

      notifications = @user.notifications.order(created_at: :desc)
      notifications = notifications.for_mentions if params[:filter] == "mentions"
      notifications = notifications.page(page).per(per_page)

      render json: notifications.map { |n|
        enriched = enrich_json_data(n.json_data)
        {
          id: n.id,
          notifiable_type: n.notifiable_type,
          notifiable_id: n.notifiable_id,
          action: n.action,
          read: n.read,
          json_data: enriched,
          created_at: n.created_at.utc.iso8601,
        }
      }
    end
    private

    # Compute id_code for comment references stored in json_data
    def enrich_json_data(data)
      return data unless data.is_a?(Hash) && data.dig("comment", "id")

      comment_id_code = data["comment"]["id"].to_s(26)
      data.merge("comment" => data["comment"].merge("id_code" => comment_id_code))
    end
  end
end

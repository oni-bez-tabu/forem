module Api
  module V1
    class CommentsController < ApiController
      include Api::CommentsController

      before_action :set_cache_control_headers, only: %i[index show]
      after_action :verify_authorized, only: %i[create]
    end
  end
end

module Messages
  class WebhooksController < ApplicationController
    skip_before_action :verify_authenticity_token

    CHAT_WEBHOOK_TOKEN = ApplicationConfig["CHAT_WEBHOOK_TOKEN"]

    def notifications
      unless valid_token?
        Rails.logger.error "Invalid chat webhook token"
        return render json: { error: "Unauthorized" }, status: :unauthorized
      end

      payload = JSON.parse(request.body.read)

      unless valid_payload?(payload)
        Rails.logger.error "Invalid chat webhook payload: #{payload.inspect}"
        return render json: { error: "Invalid payload" }, status: :bad_request
      end

      Rails.logger.info "Chat webhook accepted: event=#{payload['event']} toUser=#{payload.dig('toUser', 'id')} fromUser=#{payload.dig('fromUser', 'id')}"

      # Enqueue worker to process notification asynchronously
      Messages::ChatNotificationWorker.perform_async(payload.to_json)

      render json: { success: true }, status: :ok
    rescue JSON::ParserError => e
      Rails.logger.error "JSON::ParserError in chat webhook: #{e.message}"
      render json: { error: "Invalid JSON" }, status: :bad_request
    rescue StandardError => e
      Rails.logger.error "Error processing chat webhook: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: e.message }, status: :unprocessable_entity
    end

    def upload
      unless valid_token?
        Rails.logger.error "Invalid chat webhook token for image upload"
        return render json: { error: "Unauthorized" }, status: :unauthorized
      end

      # Get userId and file from multipart/form-data
      user_id = params[:userId]
      file = params[:file]

      # Validate userId
      if user_id.blank?
        return render json: { error: "userId is required" }, status: :bad_request
      end

      # Find user by ID (exact match as in database)
      user = User.find_by(id: user_id)
      unless user
        Rails.logger.error "User not found for userId: #{user_id}"
        return render json: { error: "User not found" }, status: :not_found
      end

      # Check user reputation (trusted or good standing)
      authorizer = Authorizer.for(user: user)
      unless user_has_valid_reputation?(authorizer)
        Rails.logger.error "User #{user_id} does not have required reputation (trusted or good standing)"
        return render json: { error: "User does not have required reputation" }, status: :forbidden
      end

      # Validate file
      if file.blank?
        return render json: { error: "File is required" }, status: :unprocessable_entity
      end

      invalid_image_error_message = validate_image_file(file)
      if invalid_image_error_message
        return render json: { error: invalid_image_error_message }, status: :unprocessable_entity
      end

      # Check rate limiting
      rate_limiter = RateLimitChecker.new(user)
      begin
        rate_limiter.check_limit!(:image_upload)
      rescue RateLimitChecker::LimitReached => e
        Rails.logger.warn "Rate limit reached for user #{user_id}: #{e.message}"
        return render json: { error: e.message }, status: :too_many_requests
      end

      # Upload image
      begin
        url = Messages::ImageUploadService.call(user: user, file: file)
        render json: { url: url }, status: :ok
      rescue CarrierWave::IntegrityError => e
        Rails.logger.error "CarrierWave::IntegrityError: #{e.message}"
        render json: { error: e.message }, status: :unprocessable_entity
      rescue CarrierWave::ProcessingError => e
        Rails.logger.error "CarrierWave::ProcessingError: #{e.message}"
        render json: { error: I18n.t("image_uploads_controller.server_error") }, status: :unprocessable_entity
      rescue StandardError => e
        Rails.logger.error "Error uploading image: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render json: { error: e.message }, status: :unprocessable_entity
      end
    end

    private

    def valid_token?
      return false if CHAT_WEBHOOK_TOKEN.blank?

      auth_token = extract_bearer_token
      x_chat_token = request.headers["X-Chat-SDK-Token"]

      # Both tokens must match the configured token
      token_valid = ActiveSupport::SecurityUtils.secure_compare(CHAT_WEBHOOK_TOKEN, auth_token.to_s) if auth_token
      x_token_valid = ActiveSupport::SecurityUtils.secure_compare(CHAT_WEBHOOK_TOKEN, x_chat_token.to_s) if x_chat_token

      token_valid || x_token_valid
    end

    def extract_bearer_token
      auth_header = request.headers["Authorization"]
      return unless auth_header&.start_with?("Bearer ")

      auth_header.split(" ").last
    end

    def valid_payload?(payload)
      return false unless payload.is_a?(Hash)
      return false unless payload["event"] == "chat.message.unread"
      return false unless payload["thread"].is_a?(Hash)
      return false unless payload["message"].is_a?(Hash)
      return false unless payload["fromUser"].is_a?(Hash)
      return false unless payload["toUser"].is_a?(Hash)

      # Validate required thread fields
      return false if payload.dig("thread", "id").blank?
      return false if payload.dig("thread", "type").blank?

      # Validate required message fields
      return false if payload.dig("message", "id").blank?
      return false if payload.dig("message", "type").blank?

      # Validate required user fields
      return false if payload.dig("fromUser", "id").blank?
      return false if payload.dig("toUser", "id").blank?

      true
    end

    def user_has_valid_reputation?(authorizer)
      # User must be trusted OR in good standing
      return true if authorizer.trusted?

      # Good standing = no negative roles
      return false if authorizer.spam_or_suspended?
      return false if authorizer.warned?
      return false if authorizer.comment_suspended?
      return false if authorizer.limited?

      true
    end

    def validate_image_file(file)
      return is_not_file_message unless file?(file)
      return filename_too_long_message if long_filename?(file)

      nil
    end
  end
end

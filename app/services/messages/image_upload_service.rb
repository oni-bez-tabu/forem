module Messages
  class ImageUploadService
    def self.call(user:, file:)
      new(user: user, file: file).call
    end

    def initialize(user:, file:)
      @user = user
      @file = file
    end

    def call
      uploader = ArticleImageUploader.new
      uploader.store!(@file)

      # Track rate limiting
      rate_limiter.track_limit_by_action(:image_upload)

      uploader.url
    rescue CarrierWave::IntegrityError => e
      raise e
    rescue CarrierWave::ProcessingError => e
      raise e
    end

    private

    attr_reader :user, :file

    def rate_limiter
      @rate_limiter ||= RateLimitChecker.new(user)
    end
  end
end

module Integrations
  # Delivers a notification from an integration (e.g. Strefa Pary) to a Forem user:
  # creates a Notification visible in the bell (notifiable: IntegrationNotification)
  # and sends a push via PushNotifications::Send when the user allows it.
  #
  # Deduplicated by dedup_key for 7 days and rate limited per user per day (Rails.cache).
  class NotificationSend
    DEDUP_TTL = 7.days
    DAILY_LIMIT = 20
    TITLE_MAX = 120
    BODY_MAX = 500
    URL_MAX = 500

    Result = Struct.new(:status, :error, :notification, keyword_init: true) do
      def accepted? = status == :accepted
      def duplicate? = status == :duplicate
      def rate_limited? = status == :rate_limited
      def invalid? = status == :invalid
    end

    def self.call(**args)
      new(**args).call
    end

    # @param scope [String] integration scope from the api key (e.g. "strefa-pary")
    def initialize(scope:, user_id:, title:, body: nil, category: nil, url: nil, dedup_key: nil)
      @scope = scope.to_s
      @user_id = user_id
      @title = title.to_s.strip
      @body = body.to_s.strip
      @category = category.to_s.strip.presence || "inne"
      @url = url.to_s.strip
      @dedup_key = dedup_key.to_s.strip
    end

    def call
      error = validation_error
      return Result.new(status: :invalid, error: error) if error

      user = User.find_by(id: @user_id)
      return Result.new(status: :invalid, error: "user not found") unless user
      return Result.new(status: :duplicate) if duplicate?
      return Result.new(status: :rate_limited, error: "daily limit reached") if rate_limited?

      notification = create_notification(user)
      mark_delivered
      send_push(user)
      Result.new(status: :accepted, notification: notification)
    end

    private

    def validation_error
      return "user_id is required" if @user_id.blank?
      return "tytul is required" if @title.blank?
      return "tytul is too long (max #{TITLE_MAX})" if @title.length > TITLE_MAX
      return "tresc is too long (max #{BODY_MAX})" if @body.length > BODY_MAX
      return "url is too long (max #{URL_MAX})" if @url.length > URL_MAX
      return "url must be a path or an http(s) address" if @url.present? && !@url.match?(%r{\A(/|https?://)})

      nil
    end

    def dedup_cache_key
      "integrations:notifications:dedup:#{@scope}:#{@user_id}:#{@dedup_key}"
    end

    def rate_cache_key
      "integrations:notifications:rate:#{@scope}:#{@user_id}:#{Date.current}"
    end

    def duplicate?
      @dedup_key.present? && Rails.cache.exist?(dedup_cache_key)
    end

    def mark_delivered
      return if @dedup_key.blank?

      Rails.cache.write(dedup_cache_key, "1", expires_in: DEDUP_TTL)
    end

    def rate_limited?
      # Rails 7.0: increment on a missing key returns nil for MemoryStore, so seed the counter first
      # (raw, so the Redis store can INCRBY it).
      Rails.cache.write(rate_cache_key, 0, unless_exist: true, expires_in: 1.day, raw: true)
      count = Rails.cache.increment(rate_cache_key, 1, expires_in: 1.day)
      count.present? && count > DAILY_LIMIT
    end

    def create_notification(user)
      ActiveRecord::Base.transaction do
        record = IntegrationNotification.create!(
          user: user,
          scope: @scope,
          category: @category,
          title: @title,
          body: @body.presence,
          url: @url.presence,
          dedup_key: @dedup_key.presence,
        )
        Notification.create!(
          user_id: user.id,
          notifiable: record,
          action: nil,
          json_data: {
            integration: {
              scope: @scope,
              category: @category,
              title: @title,
              body: @body,
              url: @url,
              created_at: Time.current
            }
          },
        )
      end
    end

    def send_push(user)
      setting = user.notification_setting
      return if setting && !setting.mobile_integration_notifications?

      PushNotifications::Send.call(
        user_ids: [user.id],
        title: @title,
        body: @body.presence || @title,
        payload: { url: absolute_url, type: "integration", scope: @scope, category: @category },
      )
    end

    def absolute_url
      return if @url.blank?
      return URL.url(@url) if @url.start_with?("/")

      @url
    end
  end
end

class ApplicationController < ActionController::Base
  before_action :redirect_www_and_unregistred_subforems_to_root
  before_action :configure_permitted_parameters, if: :devise_controller?
  skip_before_action :track_ahoy_visit
  before_action :set_session_domain
  after_action :set_unauthenticated_session_expiry
  before_action :verify_private_forem
  protect_from_forgery with: :exception, prepend: true
  before_action :set_devise_rememberable_options # Add this line
  before_action :remember_cookie_sync
  before_action :forward_to_app_config_domain
  before_action :determine_locale
  after_action  :clear_request_store

  include SessionCurrentUser
  include ValidRequest
  include Pundit::Authorization
  include CachingHeaders
  include ImageUploads
  include DevelopmentDependencyChecks if Rails.env.development?
  include Devise::Controllers::Rememberable

  # We are not currently using this, as we're going to prefer manual review in prod.
  # This was removed due to flakiness.
  # include EdgeCacheSafetyCheck unless Rails.env.production?

  rescue_from ActionView::MissingTemplate, with: :routing_error

  rescue_from RateLimitChecker::LimitReached do |exc|
    error_too_many_requests(exc)
  end

  rescue_from ActionController::InvalidAuthenticityToken do
    ForemStatsClient.increment(
      "users.invalid_authenticity_token",
      tags: ["controller_name:#{controller_name}", "path:#{request.fullpath}"],
    )
    respond_to do |format|
      format.html { render plain: I18n.t("application_controller.invalid_authenticity_token"), status: :unprocessable_entity }
      format.json { render json: { error: I18n.t("application_controller.invalid_authenticity_token") }, status: :unprocessable_entity }
    end
  end

  rescue_from ApplicationPolicy::UserSuspendedError, with: :respond_with_user_suspended

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  around_action :handle_argument_error

  # Kontrolery dostepne bez logowania takze na prywatnym Foremie. Poza oczywistymi
  # (rejestracja, logowanie spolecznosciowe) sa tu sciezki wolane z zewnatrz albo z
  # linkow w mailach -- kazda ma wlasne zabezpieczenie (token w adresie, sekret,
  # podpis webhooka), wiec bramka logowania tylko by je psula:
  #   email_subscriptions     -- wypisanie sie z powiadomien linkiem z maila
  #   magic_links             -- logowanie linkiem bez hasla
  #   mailchimp_unsubscribes  -- webhook wypisania z Mailchimpa
  #   stripe_events           -- webhook platnosci Stripe
  #   webhooks                -- przychodzace webhooki czatu (wlasny bearer token)
  PUBLIC_CONTROLLERS = %w[async_info
                          confirmations
                          deep_links
                          email_subscriptions
                          ga_events
                          health_checks
                          instances
                          invitations
                          magic_links
                          mailchimp_unsubscribes
                          omniauth_callbacks
                          pages
                          passwords
                          registrations
                          service_worker
                          sitemaps
                          stories
                          stripe_events
                          video_states
                          webhooks].freeze
  private_constant :PUBLIC_CONTROLLERS

  # Individual actions that stay reachable on a private Forem, where opening the whole
  # controller would expose more than intended. Keyed by controller_name.
  PUBLIC_CONTROLLER_ACTIONS = {
    "articles" => %w[feed].freeze, # RSS
    "comments" => %w[index].freeze, # comment permalinks under a public post
    # Liczniki reakcji pod publicznym postem. Sama akcja index, bo create musi zostac
    # za logowaniem. Dla anonima zwraca wylacznie sumy (osobiste reakcje to Reaction.none)
    # i jest cache'owana na dwa tygodnie -- wprost zaprojektowana pod niezalogowanych.
    "reactions" => %w[index].freeze,
    # Reklamy i promocje na publicznych stronach postow. Tak jak reactions#index --
    # dla anonima cache'owane, a user_signed_in? decyduje, ktory billboard wybrac.
    "billboards" => %w[show].freeze,
    # Doladowywanie kolejnych postow przy przewijaniu profilu. Sama akcja feed_content,
    # ktora jako jedyna w tym kontrolerze nie wymaga logowania z wlasnego projektu.
    # Nie otwiera to wyszukiwarki tylnymi drzwiami: przy skonfigurowanej Algolii
    # zapytanie z fraza zwraca pusta liste, przechodzi tylko listowanie bez szukania.
    "search" => %w[feed_content].freeze
  }.freeze
  private_constant :PUBLIC_CONTROLLER_ACTIONS

  CONTENT_CHANGE_PATHS = [
    "/onboarding/tags", # Needs to change when suggested_tags is edited.
    "/onboarding", # Page is cached at edge.
    "/", # Page is cached at edge.
  ].freeze
  private_constant :CONTENT_CHANGE_PATHS

  # @!scope class
  # @!attribute [w] api_action
  #   If set to true, all actions on the class (and subclasses) will be considered "api_actions"
  #
  #   @param input [Boolean]
  #   @see ApplicationController#api_action?
  #   @see ApplicationController#verify_private_forem
  #   @see https://api.rubyonrails.org/classes/Class.html#method-i-class_attribute Class.class_attribute
  class_attribute :api_action, default: false, instance_writer: false

  # @!scope instance
  # @!attribute [r] api_action?
  #   By default, all actions are *not* an `api_action?`
  #   @return [TrueClass] if the current requested action is for the API
  #   @return [FalseClass] if the current requested action is not part of the API
  #   @see Api::V0::ApiController
  #   @see Api::V1::ApiController
  #   @see ApplicationController.api_action
  #   @see ApplicationController#verify_private_forem

  def verify_private_forem
    return if controller_name.in?(PUBLIC_CONTROLLERS)
    return if PUBLIC_CONTROLLER_ACTIONS[controller_name]&.include?(action_name)
    return if self.class.module_parent.to_s == "Admin"
    return if user_signed_in? || Settings::UserExperience.public

    if api_action?
      authenticate!
    else
      redirect_to_sign_up_from(request.url)
    end
  end

  # Send an anonymous visitor to sign up, remembering where they were headed so that
  # `after_sign_in_path_for` can drop them back there once they have an account.
  #
  # @param destination [String] the url to return to after signing in
  def redirect_to_sign_up_from(destination)
    store_location_for(:user, destination) if request.get? && !request.xhr?
    redirect_to sign_up_path
  end

  # How long the edge may serve the landing page before revalidating.
  LANDING_EDGE_MAX_AGE = 12.hours.to_i
  private_constant :LANDING_EDGE_MAX_AGE

  # Devise screens that make up the sign-in / sign-up flow.
  AUTH_SCREEN_CONTROLLERS = %w[registrations sessions passwords confirmations].freeze
  private_constant :AUTH_SCREEN_CONTROLLERS

  # Sign-in and sign-up render dark in a browser, and stay light inside the mobile app - the
  # app draws its own light chrome around the web view, so a dark form looks broken in it.
  # The app identifies itself with the ForemWebView suffix on its user agent.
  def dark_auth_screen?
    return false if user_signed_in?
    return false if request.user_agent.to_s.include?("ForemWebView")

    AUTH_SCREEN_CONTROLLERS.include?(controller_name)
  end
  helper_method :dark_auth_screen?

  # Whether an anonymous visitor may browse beyond the pages a private Forem keeps open
  # (posts, profiles, static pages). Drives both the feed gate and the navigation UI.
  def open_to_anonymous_browsing?
    user_signed_in? || Settings::UserExperience.public
  end
  helper_method :open_to_anonymous_browsing?

  # The locked screen an anonymous visitor sees in place of the home feed.
  #
  # An administrator can still override it with a Page marked as the landing page; otherwise we
  # render the designed landing, which is the front door of a private Forem.
  def render_landing_page
    if (@page = Page.landing_page)
      render template: "pages/show"
    else
      # Te same zrodla, z ktorych korzysta zwykla strona glowna (articles/index.html.erb),
      # zeby tytul i opis landingu zmienialy sie razem z ustawieniami spolecznosci.
      @landing_title = Settings::Community.community_name
      @landing_description = Settings::Community.community_description.presence ||
        Settings::Community.tagline
      set_landing_cache_headers
      render template: "pages/landing", layout: "landing"
    end
  end

  # The landing is byte-identical for every anonymous visitor and holds nothing user-specific,
  # so it is the one response a private Forem can safely hand to the edge. The shared
  # `set_cache_control_headers` bails out whenever the Forem is private, hence the explicit set.
  def set_landing_cache_headers
    set_surrogate_key_header "landing_page"
    RequestStore.store[:edge_caching_in_place] = true
    response.headers["Cache-Control"] = "public, no-cache" # Fastly only; browsers revalidate.
    response.headers["X-Accel-Expires"] = LANDING_EDGE_MAX_AGE.to_s
    response.headers["Surrogate-Control"] = build_surrogate_control(
      LANDING_EDGE_MAX_AGE, stale_while_revalidate: 3600, stale_if_error: 86_400
    )
  end

  # When called, raise ActiveRecord::RecordNotFound.
  #
  # @raise [ActiveRecord::RecordNotFound] when called
  def not_found
    raise ActiveRecord::RecordNotFound, "Not Found"
  end

  # When called, raise ActionController::RoutingError.
  # @raise [ActionController::RoutingError] when called
  def routing_error
    raise ActionController::RoutingError, "Routing Error"
  end

  # When called render unauthorized JSON status and raise Pundit::NotAuthorizedError
  #
  # @raise [Pundit::NotAuthorizedError]
  #
  # @note [@jeremyf] It's a little surprising that we both render a JSON response and raise an
  #       exception.
  def not_authorized
    render json: { error: I18n.t("application_controller.not_authorized") }, status: :unauthorized
    raise Pundit::NotAuthorizedError, "Unauthorized"
  end

  def user_not_authorized
    raise Pundit::NotAuthorizedError, "You are not authorized to perform this action."
  end

  def bad_request
    respond_to do |format|
      format.html do
        raise if Rails.env.development?

        render plain: "The request could not be understood (400).", status: :bad_request
      end
      format.json do
        render json: { error: I18n.t("application_controller.bad_request") }, status: :bad_request
      end
      format.any do
        render plain: "The request could not be understood (400).", status: :bad_request
      end
    end
  end

  def handle_argument_error
    yield
  rescue ArgumentError => exception
    if exception.message.include?("string contains null byte") || exception.message.include?("invalid byte sequence")
      bad_request
    else
      raise exception
    end
  end

  def error_too_many_requests(exc)
    response.headers["Retry-After"] = exc.retry_after
    render json: { error: exc.message, status: 429 }, status: :too_many_requests
  end

  # This method is envisioned as a :before_action callback.
  #
  # @return [TrueClass] if we have a current_user
  # @return [FalseClass] if we don't have a current_user
  #
  # @see {#authenticate_user!} for when you want to raise an error if we don't have a current user.
  def authenticate_user
    return false unless current_user

    Honeycomb.add_field("current_user_id", current_user.id)
    true
  end

  # @deprecated Use {#authenticate_user} and #{ApplicationPolicy}.
  #
  # When we don't have a current user, render a response that prompts the requester to authenticate.
  # This function circumvents the work that should be done in the {ApplicationPolicy} layer.
  #
  # @return [TrueClass] if we have an authenticated user
  #
  # @note This method is envisioned as a :before_action callback.
  #
  # @see {#authenticate_user}
  # @see {ApplicationPolicy} for discussion around authentication and authorization.
  def authenticate_user!
    return true if authenticate_user

    respond_with_request_for_authentication
  end

  def set_subforem_cors_headers
    allowed_origins = Subforem.cached_domains.map { |domain| "https://#{domain}" }

    if allowed_origins.include?(request.origin)
      response.set_header("Access-Control-Allow-Origin", request.origin)
    end

    response.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD")
    response.set_header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With")
    response.set_header("Access-Control-Allow-Credentials", "true") # If credentials (cookies) are needed
  end

  def should_redirect_to_subforem?(article)
    subforem_not_same = article.subforem_id.present? && article.subforem_id != RequestStore.store[:subforem_id]
    subforem_not_default_and_no_subforem_id = article.subforem_id.blank? &&
      RequestStore.store[:subforem_id].present? &&
      (RequestStore.store[:subforem_id] != RequestStore.store[:default_subforem_id])
    subforem_not_same || subforem_not_default_and_no_subforem_id
  end

  def redirect_page_if_different_subforem
    return unless @page.subforem_id.present? &&
      RequestStore.store[:subforem_id].present? &&
      @page.subforem_id != RequestStore.store[:subforem_id]

    redirect_to URL.page(@page), allow_other_host: true, status: :moved_permanently
  end

  def respond_with_request_for_authentication
    respond_to do |format|
      format.html { redirect_to new_magic_link_path }
      format.json { render json: { error: I18n.t("application_controller.please_sign_in") }, status: :unauthorized }
    end
  end

  def redirect_permanently_to(url = nil, **args)
    if url
      redirect_to(url + internal_nav_param, status: :moved_permanently)
    else
      redirect_to(args.merge({ i: params[:i] }), status: :moved_permanently)
    end
  end

  def customize_params
    params[:signed_in] = user_signed_in?.to_s
  end

  # This method is used by Devise to decide which is the path to redirect
  # the user to after a successful log in
  def after_sign_in_path_for(resource)
    if current_user.saw_onboarding
      path = request.env["omniauth.origin"] || stored_location_for(resource) || root_path(signin: "true")

      if URI.parse(path).path == "/signout_confirm"
        path = root_path(signin: "true")
      end

      signin_param = { "signin" => "true" } # the "signin" param is used by the service worker

      uri = Addressable::URI.parse(path)
      uri.query_values = if uri.query_values
                           # Ignore i=i (internal navigation) param
                           uri.query_values.except("i").merge(signin_param)
                         else
                           signin_param
                         end

      uri.to_s
    else
      referrer = request.env["omniauth.origin"] || "none"
      onboarding_path(referrer: referrer)
    end
  end

  def after_accept_path_for(_resource)
    onboarding_path
  end

  # @deprecated This is a policy related question and should be part of an ApplicationPolicy
  def check_suspended
    return unless current_user&.spam_or_suspended?

    respond_with_user_suspended
  end

  def respond_with_user_suspended
    response.status = :forbidden
    render "pages/forbidden"
  end

  def internal_navigation?
    params[:i] == "i"
  end
  helper_method :internal_navigation?

  def feed_style_preference
    Settings::UserExperience.feed_style
  end
  helper_method :feed_style_preference

  def set_no_cache_header
    response.headers["Cache-Control"] = "no-cache, no-store"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "Fri, 01 Jan 1990 00:00:00 GMT"
  end

  def rate_limit!(action)
    rate_limiter.check_limit!(action)
  end

  def rate_limiter
    (current_user || anonymous_user).rate_limiter
  end

  def anonymous_user
    User.new(ip_address: request.env["HTTP_FASTLY_CLIENT_IP"] || request.remote_ip)
  end

  def initialize_stripe
    Stripe.api_key = Settings::General.stripe_api_key

    return unless Rails.env.development? && Stripe.api_key.present?

    Stripe.log_level = Stripe::LEVEL_INFO
  end

  def determine_locale
    I18n.locale = if %w[en fr pt pl].include?(params[:locale])
                    params[:locale]
                  else
                    Settings::UserExperience.default_locale
                  end
  end

  def set_devise_rememberable_options
    # Determine the domain based on the request
    domain = if Rails.env.production?
               # List of your secondary domains
               secondary_domains = ApplicationConfig["SECONDARY_APP_DOMAINS"].to_s.split(",").map(&:strip)
               if secondary_domains.include?(request.host)
                 request.session_options[:domain] = root_domain(request.host)
               else
                 Settings::General.app_domain.present? ? root_domain(Settings::General.app_domain) : ApplicationConfig["APP_DOMAIN"]
               end
             else
               # In non-production environments, don't set the domain
               nil
             end

    # Set the rememberable options for Devise
    request.env["devise.rememberable_options"] = {
      domain: domain,
      secure: ApplicationConfig["FORCE_SSL_IN_RAILS"] == "true",
      httponly: true
    }
  end

  def remember_cookie_sync
    # Set remember cookie token in case not properly set.
    if user_signed_in? &&
        cookies[:remember_user_token].blank?
      current_user.remember_me = true
      current_user.remember_me!
      remember_me(current_user)
    end
  end

  def after_sign_out_path_for(_resource_or_scope)
    "/enter"
  end

  def current_user_by_token
    auth_header = request.headers["Authorization"]
    return unless auth_header.present? && auth_header.start_with?("Bearer ")

    token = auth_header.split(" ").last
    payload = decode_auth_token(token)
    return unless payload && payload["user_id"]

    user = User.find_by(id: payload["user_id"])
    return unless user

    @current_user = user
    @token_authenticated = true
  end

  def token_authenticated?
    @token_authenticated
  end

  def decode_auth_token(token)
    JWT.decode(token, Rails.application.secret_key_base, true, algorithm: "HS256")[0]
  rescue JWT::ExpiredSignature
    nil
  rescue StandardError
    nil
  end

  def client_geolocation
    # if session_current_user_id
    #   request.headers["X-Client-Geo"]
    # else
    #   request.headers["X-Cacheable-Client-Geo"]
    # end

    return "PL"
  end
  helper_method :client_geolocation

  def default_email_optin_allowed?
    return false if Settings::General.geos_with_allowed_default_email_opt_in.blank?

    Settings::General.geos_with_allowed_default_email_opt_in.any? do |geo|
      client_geolocation.to_s.starts_with?(geo)
    end
  end
  helper_method :default_email_optin_allowed?

  def forward_to_app_config_domain
    # Do not redirect if we are intentionally passing a domain for context.
    return if params[:passed_domain].present?

    # Let's only redirect get requests for this purpose.
    return unless request.get? &&
      # If the request equals the original set domain, e.g. forem-x.forem.cloud.
      request.host == ENV["APP_DOMAIN"] &&
      # If the app domain config has now been set, let's go there instead.
      ENV["APP_DOMAIN"] != Settings::General.app_domain

    redirect_to URL.url(request.fullpath), allow_other_host: true
  end

  def bust_content_change_caches
    EdgeCache::Bust.call(CONTENT_CHANGE_PATHS)
    Settings::General.admin_action_taken_at = Time.current # Used as cache key
  end

  def feature_flag_enabled?(flag_name, acting_as: current_user)
    FeatureFlag.enabled_for_user?(flag_name, acting_as)
  end

  helper_method :feature_flag_enabled?

  private

  def redirect_www_and_unregistred_subforems_to_root
    # This redirect should ideally be done at the edge, but if that is not possible, we can do it here.
    return unless ApplicationConfig["REDIRECT_WWW_TO_ROOT"] == "true"

    if request.host.start_with?("www.")
      new_host = request.host.sub(/^www\./i, "")
      redirect_to("#{request.protocol}#{new_host}#{request.fullpath}", allow_other_host: true,
                                                                       status: :moved_permanently)
    elsif request.host.end_with?(".#{RequestStore.store[:root_subforem_domain]}") && RequestStore.store[:subforem_id].blank?
      new_host = RequestStore.store[:root_subforem_domain]
      redirect_to("#{request.protocol}#{new_host}#{request.fullpath}", allow_other_host: true,
                                                                       status: :moved_permanently)
    end
  end

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: %i[username name profile_image profile_image_url])
    devise_parameter_sanitizer.permit(:accept_invitation, keys: %i[name])
  end

  def set_unauthenticated_session_expiry
    # If the user is unauthenticated, expire their session quickly to save Redis memory.
    # Authenticated users use the default `expire_after` defined in config/initializers/session_store.rb
    return if user_signed_in?

    configured_ttl = ApplicationConfig["ANONYMOUS_SESSION_EXPIRY_SECONDS"]
    ttl_seconds = if configured_ttl.present?
                    configured_ttl.to_i
                  else
                    2.days.to_i
                  end

    request.session_options[:expire_after] = ttl_seconds
  end

  def set_session_domain
    if Rails.env.production?
      # List of your secondary domains
      secondary_domains = ApplicationConfig["SECONDARY_APP_DOMAINS"].to_s.split(",").map(&:strip)
      if secondary_domains.include?(request.host)
        request.session_options[:domain] = root_domain(request.host)
      else
        # For main domain, set to ApplicationConfig["APP_DOMAIN"]
        request.session_options[:domain] =
          Settings::General.app_domain.present? ? root_domain(Settings::General.app_domain) : ApplicationConfig["APP_DOMAIN"]
      end
    else
      # In non-production environments, don't set the domain
      request.session_options[:domain] = nil
    end
  end

  def root_domain(host)
    # The `default_rule: nil` option ensures it raises an error if the domain is invalid
    parsed = PublicSuffix.parse(host, default_rule: nil)
    parsed.domain # Returns the domain with TLD, e.g. "example.com"
  rescue PublicSuffix::DomainInvalid
    host
  end

  def internal_nav_param
    return "" unless params[:i] == "i"

    "?i=i"
  end

  def clear_request_store
    # Clear RequestStore in development/test to avoid lingering. Not important in prod.
    RequestStore.clear! unless Rails.env.production?
  end
end

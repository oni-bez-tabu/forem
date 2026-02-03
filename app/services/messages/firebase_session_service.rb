module Messages
  class FirebaseSessionService
    def self.call(user)
      new(user).call
    end

    def initialize(user)
      @user = user
      @authorizer = Authorizer.for(user: user)
    end

    def call
      cache_key = "messages/firebase_session/#{user.id}"
      result = self.class.firebase_session_cache.fetch(cache_key, expires_in: 1.hour) do
        Rails.logger.info "FirebaseSessionService: cache miss for user #{user.id}, generating token..."
        ensure_firebase_user
        generate_custom_token
      end
      Rails.logger.info "FirebaseSessionService: returning token=#{result.present?} for user #{user.id}"
      result
    end

    # W development z wyłączonym dev:cache Rails używa null_store, który nie persystuje.
    # Fallback do MemoryStore zapewnia działanie cache sesji bez potrzeby redis dev:cache.
    def self.firebase_session_cache
      if Rails.cache.is_a?(ActiveSupport::Cache::NullStore)
        @firebase_session_memory_cache ||= ActiveSupport::Cache::MemoryStore.new
      else
        Rails.cache
      end
    end

    private

    attr_reader :user, :authorizer

    def emulator_enabled?
      firestore_host = ApplicationConfig["FIRESTORE_EMULATOR_HOST"]
      auth_host = ApplicationConfig["FIREBASE_AUTH_EMULATOR_HOST"]
      enabled = firestore_host.present? || auth_host.present?

      if enabled
        Rails.logger.debug do
          "Firebase emulator enabled: FIRESTORE_EMULATOR_HOST=#{firestore_host}, FIREBASE_AUTH_EMULATOR_HOST=#{auth_host}"
        end
      end

      enabled
    end

    def firestore_base_url(project_id)
      if ApplicationConfig["FIRESTORE_EMULATOR_HOST"].present?
        url = "http://#{ApplicationConfig['FIRESTORE_EMULATOR_HOST']}/v1"
        Rails.logger.debug { "Using Firestore emulator: #{url}" }
        url
      else
        Rails.logger.debug "Using Firestore production"
        "https://firestore.googleapis.com/v1"
      end
    end

    def auth_base_url
      if ApplicationConfig["FIREBASE_AUTH_EMULATOR_HOST"].present?
        url = "http://#{ApplicationConfig['FIREBASE_AUTH_EMULATOR_HOST']}/identitytoolkit.googleapis.com/v1"
        Rails.logger.debug { "Using Auth emulator: #{url}" }
        url
      else
        Rails.logger.debug "Using Auth production"
        "https://identitytoolkit.googleapis.com/v1"
      end
    end

    def auth_api_key_param
      # Emulator requires a key parameter - use project_id from credentials
      if emulator_enabled?
        project_id = $firebase_project_id || get_project_id
        project_id ? "?key=#{project_id}" : "?key=fake-api-key"
      else
        ""
      end
    end

    def use_ssl?
      !emulator_enabled?
    end

    def ensure_firebase_user
      return unless firebase_configured?

      begin
        require "jwt"
        require "net/http"
        require "uri"
        require "json"

        # Get OAuth 2.0 access token
        # For emulator, we still need token to bypass security rules
        access_token = get_access_token
        return unless access_token

        uid = user.id.to_s
        project_id = $firebase_project_id || get_project_id
        return unless project_id

        # Try to get existing user
        existing_user = get_firebase_user(access_token, project_id, uid)

        if existing_user
          Rails.logger.info "Firebase user #{uid} exists, updating..."
          # Update user if display name or photo URL changed
          update_firebase_user(access_token, project_id, uid)
        else
          Rails.logger.info "Firebase user #{uid} does not exist, creating..."
          # Create new user
          create_firebase_user(access_token, project_id, uid)
        end

        # Ensure user document exists in Firestore 'users' collection
        ensure_firestore_user(access_token, project_id, uid)
      rescue Errno::ECONNREFUSED, SocketError => e
        Rails.logger.warn "Firebase emulator connection refused: #{e.message}. Make sure emulator is running."
        # Don't raise - we can still generate token even if user creation fails
      rescue StandardError => e
        Rails.logger.error "Failed to ensure Firebase user: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        # Don't raise - we can still generate token even if user creation fails
      end
    end

    def get_access_token
      # For emulator, we still need OAuth token to bypass security rules
      # Emulator accepts OAuth tokens but doesn't verify them strictly
      # Without token, emulator enforces security rules which may block operations

      # Generate JWT for OAuth 2.0 service account flow
      now_seconds = Time.now.to_i
      jwt_payload = {
        iss: $firebase_service_account_email,
        sub: $firebase_service_account_email,
        aud: "https://oauth2.googleapis.com/token",
        iat: now_seconds,
        exp: now_seconds + 3600,
        scope: "https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/datastore"
      }

      jwt_token = JWT.encode(jwt_payload, $firebase_private_key, "RS256")

      # Exchange JWT for access token
      uri = URI("https://oauth2.googleapis.com/token")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true

      request = Net::HTTP::Post.new(uri.path)
      request.set_form_data(
        "grant_type" => "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion" => jwt_token,
      )

      response = http.request(request)
      if response.code == "200"
        JSON.parse(response.body)["access_token"]
      else
        Rails.logger.error "Failed to get access token: #{response.body}"
        nil
      end
    end

    def get_project_id
      # Extract project ID from service account email or from credentials
      if ApplicationConfig["FIREBASE_ADMIN_CREDENTIALS_JSON"].present?
        credentials = JSON.parse(ApplicationConfig["FIREBASE_ADMIN_CREDENTIALS_JSON"])
        credentials["project_id"]
      elsif ApplicationConfig["FIREBASE_PROJECT_ID"].present?
        ApplicationConfig["FIREBASE_PROJECT_ID"]
      else
        # Try to extract from email (format: service-account@PROJECT_ID.iam.gserviceaccount.com)
        email = $firebase_service_account_email
        match = email.match(/@([^.]+)\.iam\.gserviceaccount\.com/)
        match ? match[1] : nil
      end
    end

    def get_firebase_user(access_token, project_id, uid)
      base_url = auth_base_url
      path = "/projects/#{project_id}/accounts:lookup#{auth_api_key_param}"
      uri = URI("#{base_url}#{path}")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = use_ssl?

      request = Net::HTTP::Post.new(uri.request_uri)
      request["Authorization"] = "Bearer #{access_token}" if access_token
      request["Content-Type"] = "application/json"
      request.body = { localId: [uid] }.to_json

      response = http.request(request)
      if response.code == "200"
        data = JSON.parse(response.body)
        data["users"]&.first
      else
        nil
      end
    rescue StandardError => e
      Rails.logger.error "Failed to get Firebase user: #{e.message}"
      nil
    end

    def create_firebase_user(access_token, project_id, uid)
      base_url = auth_base_url
      path = "/projects/#{project_id}/accounts#{auth_api_key_param}"
      uri = URI("#{base_url}#{path}")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = use_ssl?

      request = Net::HTTP::Post.new(uri.request_uri)
      request["Authorization"] = "Bearer #{access_token}" if access_token
      request["Content-Type"] = "application/json"
      request.body = {
        localId: uid,
        displayName: user_display_name,
        photoUrl: user_avatar_url
      }.to_json

      response = http.request(request)
      if response.code == "200"
        Rails.logger.info "Successfully created Firebase user #{uid}"
        return
      end

      Rails.logger.error "Failed to create Firebase user #{uid}: HTTP #{response.code} - #{response.body}"
    end

    def update_firebase_user(access_token, project_id, uid)
      base_url = auth_base_url
      path = "/projects/#{project_id}/accounts:update#{auth_api_key_param}"
      uri = URI("#{base_url}#{path}")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = use_ssl?

      request = Net::HTTP::Post.new(uri.request_uri)
      request["Authorization"] = "Bearer #{access_token}" if access_token
      request["Content-Type"] = "application/json"
      request.body = {
        localId: uid,
        displayName: user_display_name,
        photoUrl: user_avatar_url
      }.to_json

      response = http.request(request)
      if response.code == "200"
        Rails.logger.info "Successfully updated Firebase user #{uid}"
        return
      end

      Rails.logger.error "Failed to update Firebase user #{uid}: HTTP #{response.code} - #{response.body}"
    end

    def ensure_firestore_user(access_token, project_id, uid)
      # Check if document exists in Firestore
      collection = "users"
      doc_id = uid
      doc_path = "#{collection}/#{doc_id}"
      existing_doc = get_firestore_document(access_token, project_id, doc_path)

      user_data = {
        uid: uid,
        username: user.username,
        displayName: user_display_name,
        photoURL: user_avatar_url,
        chatBanned: user_chat_banned?,
        updatedAt: Time.now.utc.iso8601
      }

      if existing_doc
        Rails.logger.info "Firestore user document #{uid} exists, updating..."
        update_firestore_document(access_token, project_id, doc_path, user_data)
      else
        Rails.logger.info "Firestore user document #{uid} does not exist, creating..."
        create_firestore_document(access_token, project_id, doc_path, user_data)
      end
    rescue StandardError => e
      Rails.logger.error "Failed to ensure Firestore user: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
    end

    def get_firestore_document(access_token, project_id, doc_path)
      # Firestore REST API: Get document
      base_url = firestore_base_url(project_id)
      path = "/projects/#{project_id}/databases/(default)/documents/#{doc_path}"
      uri = URI("#{base_url}#{path}")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = use_ssl?

      request = Net::HTTP::Get.new(uri.request_uri)
      # Use OAuth token to bypass security rules (works for both production and emulator)
      request["Authorization"] = "Bearer #{access_token}" if access_token

      response = http.request(request)
      if response.code == "200"
        JSON.parse(response.body)
      else
        nil
      end
    rescue StandardError => e
      Rails.logger.error "Failed to get Firestore document: #{e.message}"
      nil
    end

    def create_firestore_document(access_token, project_id, doc_path, data)
      # Firestore REST API: Create document
      # Format: projects/{project}/databases/{database}/documents/{collection}/{document}
      # For creating, we use POST to the collection path with documentId parameter
      collection, doc_id = doc_path.split("/", 2)
      base_url = firestore_base_url(project_id)
      path = "/projects/#{project_id}/databases/(default)/documents/#{collection}?documentId=#{doc_id}"
      uri = URI("#{base_url}#{path}")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = use_ssl?

      # Convert data to Firestore format
      fields = convert_to_firestore_fields(data)

      request = Net::HTTP::Post.new(uri.request_uri)
      # Use OAuth token to bypass security rules (works for both production and emulator)
      request["Authorization"] = "Bearer #{access_token}" if access_token
      request["Content-Type"] = "application/json"
      request.body = { fields: fields }.to_json

      response = http.request(request)
      if response.code == "200"
        Rails.logger.info "Successfully created Firestore user document #{doc_path}"
      else
        Rails.logger.error "Failed to create Firestore user document #{doc_path}: HTTP #{response.code} - #{response.body}"
      end
    end

    def update_firestore_document(access_token, project_id, doc_path, data)
      # Firestore REST API: Update document
      base_url = firestore_base_url(project_id)
      path = "/projects/#{project_id}/databases/(default)/documents/#{doc_path}"
      update_mask = "updateMask.fieldPaths=username&updateMask.fieldPaths=displayName&updateMask.fieldPaths=photoURL&updateMask.fieldPaths=chatBanned&updateMask.fieldPaths=updatedAt"
      path += "?#{update_mask}"
      uri = URI("#{base_url}#{path}")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = use_ssl?

      # Convert data to Firestore format
      fields = convert_to_firestore_fields(data)

      request = Net::HTTP::Patch.new(uri.request_uri)
      # Use OAuth token to bypass security rules (works for both production and emulator)
      request["Authorization"] = "Bearer #{access_token}" if access_token
      request["Content-Type"] = "application/json"
      request.body = { fields: fields }.to_json

      response = http.request(request)
      if response.code == "200"
        Rails.logger.info "Successfully updated Firestore user document #{doc_path}"
      else
        Rails.logger.error "Failed to update Firestore user document #{doc_path}: HTTP #{response.code} - #{response.body}"
      end
    end

    def convert_to_firestore_fields(data)
      # Convert Ruby hash to Firestore field format
      fields = {}
      data.each do |key, value|
        fields[key.to_s] = case value
                           when String
                             { stringValue: value }
                           when Integer
                             { integerValue: value.to_s }
                           when TrueClass, FalseClass
                             { booleanValue: value }
                           when NilClass
                             { nullValue: nil }
                           else
                             { stringValue: value.to_s }
                           end
      end
      fields
    end

    def generate_custom_token
      unless firebase_configured?
        Rails.logger.warn "FirebaseSessionService: not configured - email=#{$firebase_service_account_email.present?} key=#{$firebase_private_key.present?}"
        return
      end

      begin
        require "jwt"

        uid = user.id.to_s
        project_id = $firebase_project_id || get_project_id

        # Ensure Firestore user document is up to date before generating token
        if project_id
          access_token = get_access_token
          if access_token
            ensure_firestore_user(access_token, project_id, uid)
          end
        end

        now_seconds = Time.now.to_i

        # Custom claims to include in the token
        custom_claims = {
          username: user.username,
          displayName: user_display_name,
          photoURL: user_avatar_url,
          chatBanned: user_chat_banned?
        }

        # Build JWT payload according to Firebase documentation
        # https://firebase.google.com/docs/auth/admin/create-custom-tokens#ruby
        payload = {
          iss: $firebase_service_account_email,
          sub: $firebase_service_account_email,
          aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
          iat: now_seconds,
          exp: now_seconds + (60 * 60), # Maximum expiration time is one hour
          uid: uid,
          claims: custom_claims
        }

        # Encode and sign the JWT with RS256 algorithm
        JWT.encode(payload, $firebase_private_key, "RS256")
      rescue StandardError => e
        Rails.logger.error "Failed to generate Firebase custom token: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        raise
      end
    end

    def user_display_name
      user.name.presence || user.username
    end

    def user_avatar_url
      user.profile_image_90 || ""
    end

    def user_chat_banned?
      # User is banned from chat if they are NOT in "Good standing" or "Trusted" status
      # Good standing = no negative roles (spam, suspended, warned, comment_suspended, limited)
      # Trusted = has trusted role
      return true if authorizer.spam_or_suspended?
      return true if authorizer.warned?
      return true if authorizer.comment_suspended?
      return true if authorizer.limited?

      # If user is trusted, they're not banned
      return false if authorizer.trusted?

      # If no negative roles and not trusted, they're in "Good standing" - not banned
      false
    end

    def firebase_configured?
      $firebase_service_account_email.present? && $firebase_private_key.present?
    end
  end
end

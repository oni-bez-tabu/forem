# Firebase Admin credentials initialization for custom token generation
# Credentials can be provided via:
# - FIREBASE_ADMIN_CREDENTIALS_JSON: Full JSON string with service account credentials
# - OR individual env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
#
# Note: Firebase doesn't have an official Admin SDK for Ruby, so we use JWT gem
# to generate custom tokens directly. See:
# https://firebase.google.com/docs/auth/admin/create-custom-tokens#ruby

require "jwt"
require "openssl"

if ApplicationConfig["FIREBASE_ADMIN_CREDENTIALS_JSON"].present?
  begin
    credentials_json = ApplicationConfig["FIREBASE_ADMIN_CREDENTIALS_JSON"]
    credentials_hash = JSON.parse(credentials_json)

    # Fix private key newlines if needed (common issue with env vars)
    if credentials_hash["private_key"]
      credentials_hash["private_key"] = credentials_hash["private_key"].gsub("\\n", "\n")
    end

    # Store service account email, private key, and project ID for JWT generation
    $firebase_service_account_email = credentials_hash["client_email"]
    $firebase_private_key = OpenSSL::PKey::RSA.new(credentials_hash["private_key"])
    $firebase_project_id = credentials_hash["project_id"]

    Rails.logger.info "Firebase credentials initialized successfully"
  rescue JSON::ParserError => e
    Rails.logger.error "Failed to parse FIREBASE_ADMIN_CREDENTIALS_JSON: #{e.message}"
  rescue StandardError => e
    Rails.logger.error "Failed to initialize Firebase credentials: #{e.message}"
  end
elsif ApplicationConfig["FIREBASE_PROJECT_ID"].present? &&
    ApplicationConfig["FIREBASE_CLIENT_EMAIL"].present? &&
    ApplicationConfig["FIREBASE_PRIVATE_KEY"].present?
  begin
    private_key_string = ApplicationConfig["FIREBASE_PRIVATE_KEY"].gsub("\\n", "\n")

    # Store service account email, private key, and project ID for JWT generation
    $firebase_service_account_email = ApplicationConfig["FIREBASE_CLIENT_EMAIL"]
    $firebase_private_key = OpenSSL::PKey::RSA.new(private_key_string)
    $firebase_project_id = ApplicationConfig["FIREBASE_PROJECT_ID"]

    Rails.logger.info "Firebase credentials initialized successfully with individual env vars"
  rescue StandardError => e
    Rails.logger.error "Failed to initialize Firebase credentials: #{e.message}"
  end
else
  Rails.logger.warn "Firebase credentials not initialized: missing credentials. Set FIREBASE_ADMIN_CREDENTIALS_JSON or individual env vars."
end

module Integrations
  # RSA key used to sign short-lived session tokens for integrations (e.g. Strefa Pary).
  #
  # The private key comes from ENV INTEGRATIONS_JWT_PRIVATE_KEY (PEM, newlines may be escaped as "\n").
  # In development and test, when the variable is unset, a key pair is generated once into
  # tmp/strefa-pary-jwt/ (git-ignored) so the flow can be tested locally.
  class JwtKeys
    ALGORITHM = "RS256".freeze
    DEFAULT_AUDIENCES = "strefa-pary".freeze
    DEV_KEY_DIR = Rails.root.join("tmp/strefa-pary-jwt")
    DEV_KEY_FILE = DEV_KEY_DIR.join("private.pem")

    class << self
      def configured?
        private_key.present?
      end

      def private_key
        @private_key ||= load_private_key
      end

      def public_key
        private_key&.public_key
      end

      # Key id derived from the public key, so it changes together with the key.
      def kid
        @kid ||= Digest::SHA256.hexdigest(public_key.to_der)[0, 16]
      end

      def jwk
        key = public_key
        {
          kty: "RSA",
          use: "sig",
          alg: ALGORITHM,
          kid: kid,
          n: Base64.urlsafe_encode64(key.n.to_s(2), padding: false),
          e: Base64.urlsafe_encode64(key.e.to_s(2), padding: false)
        }
      end

      def jwks
        { keys: [jwk] }
      end

      def audiences
        raw = ApplicationConfig["INTEGRATIONS_JWT_AUDIENCES"].presence || DEFAULT_AUDIENCES
        raw.split(",").map(&:strip).compact_blank
      end

      # Mostly for specs.
      def reset!
        @private_key = nil
        @kid = nil
      end

      private

      def load_private_key
        pem = ApplicationConfig["INTEGRATIONS_JWT_PRIVATE_KEY"].presence
        return OpenSSL::PKey::RSA.new(pem.gsub("\\n", "\n")) if pem
        return unless Rails.env.development? || Rails.env.test?

        development_key
      end

      def development_key
        FileUtils.mkdir_p(DEV_KEY_DIR)
        if File.exist?(DEV_KEY_FILE)
          OpenSSL::PKey::RSA.new(File.read(DEV_KEY_FILE))
        else
          key = OpenSSL::PKey::RSA.new(2048)
          File.write(DEV_KEY_FILE, key.to_pem, perm: 0o600)
          Rails.logger.warn("INTEGRATIONS_JWT_PRIVATE_KEY is unset; generated a development key in #{DEV_KEY_FILE}")
          key
        end
      end
    end
  end
end

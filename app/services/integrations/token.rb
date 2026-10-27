module Integrations
  # Issues a short-lived RS256 JWT that lets an integration (e.g. Strefa Pary) identify
  # the user who is logged in to Forem. The integration verifies it against /.well-known/jwks.json.
  class Token
    TTL = 15.minutes

    class Error < StandardError; end
    class UnknownAudience < Error; end
    class NotConfigured < Error; end

    def self.issue(user:, aud:)
      new(user: user, aud: aud).issue
    end

    def initialize(user:, aud:)
      @user = user
      @aud = aud.to_s
    end

    # @return [Hash] { token: String, exp: Integer }
    def issue
      raise NotConfigured, "INTEGRATIONS_JWT_PRIVATE_KEY is not configured" unless JwtKeys.configured?
      raise UnknownAudience, "unknown audience" unless JwtKeys.audiences.include?(@aud)

      now = Time.current.to_i
      exp = now + TTL.to_i
      payload = {
        sub: @user.id.to_s,
        aud: @aud,
        iat: now,
        exp: exp,
        iss: Settings::General.app_domain,
        name: @user.name,
        username: @user.username
      }
      token = JWT.encode(payload, JwtKeys.private_key, JwtKeys::ALGORITHM, { kid: JwtKeys.kid })
      { token: token, exp: exp }
    end
  end
end

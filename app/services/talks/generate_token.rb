module Talks
  class GenerateToken
    TIMEOUT = 20

    def self.call(...)
      new(...).call
    end

    def initialize(user)
      @user = user
    end

    def call
      response = HTTParty.post(
        'https://managedservices-prod.rteappbuilder.com/v1/token/generate',
        headers: headers,
        body: payload.to_json,
        timeout: TIMEOUT
      )

      raise "Błąd generowania tokenu: #{response.body}" unless response.success?
      response.parsed_response
    end

    private

    attr_reader :user

    def headers
      {
        'Accept' => 'application/json',
        'X-API-KEY' => '',
        'X-Project-ID' => '',
        'Content-Type' => 'application/json'
      }
    end

    def payload
      {
        user_id: user.username,
        roles: ['host']
      }
    end
  end
end

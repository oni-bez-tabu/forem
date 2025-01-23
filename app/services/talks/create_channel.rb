module Talks
  class CreateChannel
    HANDLED_ERRORS = [
      Net::OpenTimeout,
      SocketError,
      SystemCallError,
      OpenSSL::SSL::SSLError,
    ].freeze

    TIMEOUT = 20

    def self.call(...)
      new(...).call
    end

    def initialize(title:, token:)
      @title = title
      @token = token
    end

    def call
      response = HTTParty.post(
        'https://managedservices-prod.rteappbuilder.com/v1/channel',
        headers: headers,
        body: payload.to_json,
        timeout: TIMEOUT
      )

      raise "Błąd tworzenia kanału: #{response.body}" unless response.success?
      
      result_struct.new(
        channel_id: response['channel'],
        host_id: response['host_pass_phrase'],
        viewer_id: response['viewer_pass_phrase']
      )
    rescue *HANDLED_ERRORS => e
      raise "Błąd połączenia: #{e.message}"
    end

    private

    attr_reader :title, :token

    def result_struct
      Struct.new(:channel_id, :host_id, :viewer_id, keyword_init: true)
    end

    def headers
      {
        'Authorization' => "Bearer #{token}",
        'X-API-KEY' => '',
        'X-Project-ID' => '',
        'Content-Type' => 'application/json'
      }
    end

    def payload
      {
        title: title,
        enable_pstn: false
      }
    end
  end
end 
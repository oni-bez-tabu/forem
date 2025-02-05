module Talks
  class BanUserService
    def self.call(channel_id)
      require 'base64'
      require 'httparty'

      # Konfiguracja autoryzacji
      key = ApplicationConfig['AGORA_KEY']
      secret = ApplicationConfig['AGORA_SECRET']
      auth_token = Base64.strict_encode64("#{key}:#{secret}")

      # Przygotowanie danych do wysłania
      payload = {
        appid: ApplicationConfig['AGORA_APP_ID'],
        cname: channel_id,
        uid: "",
        ip: "",
        time: 0,
        privileges: ["join_channel"]
      }

      # Wysłanie requestu
      response = HTTParty.post(
        'http://api.sd-rtn.com/dev/v1/kicking-rule',
        headers: {
          'Accept' => 'application/json',
          'Content-Type' => 'application/json',
          'Authorization' => "Basic #{auth_token}"
        },
        body: payload.to_json
      )

      parsed_response = JSON.parse(response.body)
      
      { 
        success: parsed_response["status"] == "success",
        response: parsed_response 
      }
    rescue StandardError => e
      Rails.logger.error("Błąd podczas banowania użytkownika w Agorze: #{e.message}")
      { success: false, error: e.message }
    end
  end
end 
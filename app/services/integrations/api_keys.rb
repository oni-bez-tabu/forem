module Integrations
  # Parses INTEGRATIONS_API_KEYS ("scope:key,scope2:key2") and matches the api-key header.
  class ApiKeys
    def self.scope_for(api_key)
      return if api_key.blank?

      pairs.each do |scope, key|
        return scope if ActiveSupport::SecurityUtils.secure_compare(key, api_key.to_s)
      end
      nil
    end

    def self.pairs
      raw = ApplicationConfig["INTEGRATIONS_API_KEYS"].to_s
      raw.split(",").filter_map do |entry|
        scope, key = entry.strip.split(":", 2)
        next if scope.blank? || key.blank?

        [scope, key]
      end
    end
  end
end

module Api
  module V1
    # GET /api/cities/search?q=<prefix>
    #
    # Public city search used by the matching profile form (Preact
    # autocomplete) and the native mobile app. Same dataset as the
    # web `/cities/search` endpoint; this one is API-versioned.
    class CitiesController < ApiController
      RESULT_LIMIT = 10
      SERIALIZED_ATTRS = %i[id name slug voivodeship is_special].freeze

      def search
        cities = City.search_by_name(params[:q].to_s).limit(RESULT_LIMIT)
        render json: { cities: cities.as_json(only: SERIALIZED_ATTRS) }
      end
    end
  end
end

class CitiesController < ApplicationController
  RESULT_LIMIT = 10
  SERIALIZED_ATTRS = %i[id name slug voivodeship is_special].freeze

  def search
    cities = City.search_by_name(params[:q].to_s).limit(RESULT_LIMIT)
    render json: cities.as_json(only: SERIALIZED_ATTRS)
  end
end

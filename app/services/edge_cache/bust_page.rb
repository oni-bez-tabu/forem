module EdgeCache
  class BustPage
    def self.call(slug)
      return unless slug

      cache_bust = EdgeCache::Bust.new
      cache_bust.call("/page/#{slug}")
      cache_bust.call("/#{slug}")

      # The landing renders its lists from this Page, so editing it has to drop the cached
      # landing HTML at the edge too - otherwise the change is invisible until it expires.
      cache_bust.call("/") if slug == "landing-data"
    end
  end
end

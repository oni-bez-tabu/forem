class TiktokTag < LiquidTagBase
    PARTIAL = "liquids/tiktok".freeze
    # rubocop:disable Layout/LineLength
    REGISTRY_REGEXP = %r{(?:https?://)?(?:www\.)?tiktok\.com/@(?<user>[^/]+)/video/(?<post_id>\d+)}
    # rubocop:enable Layout/LineLength
    VALID_ID_REGEXP = /\A(?<post_id>\d+)\Z/
    REGEXP_OPTIONS = [REGISTRY_REGEXP].freeze
  
    def initialize(_tag_name, id, _parse_context)
      super
      input   = CGI.unescape_html(strip_tags(id))
      @path   = parse_id_or_url(input)
    end
  
    def render(_context)
      ApplicationController.render(
        partial: PARTIAL,
        locals: {
          path: @path
        },
      )
    end
  
    private
  
    def parse_id_or_url(input)
      match = pattern_match_for(input, REGEXP_OPTIONS)
      raise StandardError, I18n.t("liquid_tags.tiktok_tag.invalid_tiktok_id") unless match && match[:user]
    
      {
        user: match[:user],
        post_id: match[:post_id]
      }
    end
  end
  
  Liquid::Template.register_tag("tiktok", TiktokTag)
  
  UnifiedEmbed.register(TiktokTag, regexp: TiktokTag::REGISTRY_REGEXP)  
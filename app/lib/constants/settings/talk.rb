module Constants
  module Settings
    module Talk
      def self.details
        {
          allow_anonymous_listening: {
            description: I18n.t("lib.constants.settings.talk.anonymous_listening.description"),
            placeholder: ""
          },
          admin_only_creation: {
            description: I18n.t("lib.constants.settings.talk.admin_creation.description"),
            placeholder: ""
          }
        }
      end
    end
  end
end 
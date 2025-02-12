module Settings
  class Talk < Base
    self.table_name = :settings_talks

    # Define your settings
    setting :allow_anonymous_listening, type: :boolean, default: 0
    setting :admin_only_creation, type: :boolean, default: 1
  end
end 
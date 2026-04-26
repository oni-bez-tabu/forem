class DefaultUsersSettingsConfigThemeToDark < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    safety_assured do
      execute "UPDATE users_settings SET config_theme = 2 WHERE config_theme = 0"
    end
    change_column_default :users_settings, :config_theme, from: 0, to: 2
  end

  def down
    change_column_default :users_settings, :config_theme, from: 2, to: 0
  end
end

class AddMobileIntegrationNotificationsToUsersNotificationSettings < ActiveRecord::Migration[7.0]
  def change
    add_column :users_notification_settings, :mobile_integration_notifications, :boolean, default: true, null: false
  end
end

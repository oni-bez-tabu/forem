class AddChatNotificationSettings < ActiveRecord::Migration[7.0]
  def change
    add_column :users_notification_settings, :email_chat_notifications, :boolean, default: true, null: false
    add_column :users_notification_settings, :mobile_chat_notifications, :boolean, default: true, null: false
  end
end

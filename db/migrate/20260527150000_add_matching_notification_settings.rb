class AddMatchingNotificationSettings < ActiveRecord::Migration[7.0]
  def change
    add_column :users_notification_settings, :notify_on_new_matches, :boolean, default: true, null: false
    add_column :users_notification_settings, :notify_on_new_city_meetups, :boolean, default: true, null: false
  end
end

class AddUniqueDedupIndexToIntegrationNotifications < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :integration_notifications, %i[user_id scope dedup_key],
              unique: true,
              where: "dedup_key IS NOT NULL",
              algorithm: :concurrently,
              name: "index_integration_notifications_on_dedup"
  end
end

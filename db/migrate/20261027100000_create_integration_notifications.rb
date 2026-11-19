class CreateIntegrationNotifications < ActiveRecord::Migration[7.0]
  def change
    create_table :integration_notifications do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.string :scope, null: false
      t.string :category, null: false, default: "inne"
      t.string :title, null: false
      t.text :body
      t.string :url
      t.string :dedup_key
      t.timestamps
    end
  end
end

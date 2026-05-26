class CreateMatchingProfiles < ActiveRecord::Migration[7.0]
  def change
    create_table :matching_profiles do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }, index: { unique: true }
      t.string :photo
      t.string :identity_type, null: false
      t.references :city, null: false, foreign_key: true
      t.string :bio
      t.boolean :is_active, null: false, default: true
      t.string :moderation_state, null: false, default: "pending"
      t.string :moderation_reason
      t.timestamps
    end

    add_index :matching_profiles, :moderation_state
    add_index :matching_profiles, :is_active
  end
end

class CreateSettingsTalks < ActiveRecord::Migration[7.0]
  def change
    create_table :settings_talks do |t|
      t.string :var, null: false
      t.text :value, null: true
      t.timestamps
    end

    add_index :settings_talks, :var, unique: true
  end
end

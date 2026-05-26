class CreateCities < ActiveRecord::Migration[7.0]
  def change
    create_table :cities do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.string :name_normalized, null: false
      t.string :voivodeship
      t.boolean :is_special, null: false, default: false
      t.integer :population_hint
      t.timestamps
    end

    add_index :cities, :slug, unique: true
    add_index :cities, :name_normalized
    add_index :cities, :is_special
  end
end

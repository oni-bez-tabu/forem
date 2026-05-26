class CreateMeetups < ActiveRecord::Migration[7.0]
  def change
    create_table :meetups do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.references :organizer_user, foreign_key: { to_table: :users }
      t.references :organizer_organization, foreign_key: { to_table: :organizations }
      t.string :venue_name, null: false
      t.references :venue_city, null: false, foreign_key: { to_table: :cities }
      t.string :venue_address
      t.datetime :start_at, null: false
      t.datetime :end_at, null: false
      t.string :banner
      t.string :banner_gradient, null: false, default: "dusk"
      t.string :description_link_type, null: false
      t.references :description_internal_post, foreign_key: { to_table: :articles }
      t.string :description_external_url
      t.boolean :is_published, null: false, default: false
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.integer :going_count, null: false, default: 0
      t.integer :interested_count, null: false, default: 0
      t.timestamps
    end

    add_index :meetups, :slug, unique: true
    add_index :meetups, :start_at
    add_index :meetups, :end_at
    add_index :meetups, :is_published
  end
end

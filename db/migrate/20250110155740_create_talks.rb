class CreateTalks < ActiveRecord::Migration[7.0]
  def change
    create_table :talks do |t|
      t.string :title, null: false
      t.datetime :start_date, null: false
      t.datetime :end_date # bez null: false
      t.integer :status, default: 0, null: false
      t.references :user, null: false, foreign_key: true
      t.string :channel_id, null: false
      t.string :host_id, null: false
      t.string :viewer_id, null: false

      t.timestamps
    end

    add_index :talks, :status
    add_index :talks, :channel_id
  end
end

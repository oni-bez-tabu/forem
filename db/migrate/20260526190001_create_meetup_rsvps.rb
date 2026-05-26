class CreateMeetupRsvps < ActiveRecord::Migration[7.0]
  def change
    create_table :meetup_rsvps do |t|
      t.references :meetup, null: false, foreign_key: { on_delete: :cascade }
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.string :status, null: false
      t.timestamps
    end

    add_index :meetup_rsvps, %i[meetup_id user_id], unique: true
    add_index :meetup_rsvps, %i[meetup_id status]
  end
end

class CreateMatchingWelcomes < ActiveRecord::Migration[7.0]
  def change
    create_table :matching_welcomes do |t|
      t.references :sender_profile,
                   null: false,
                   foreign_key: { to_table: :matching_profiles, on_delete: :cascade }
      t.references :receiver_profile,
                   null: false,
                   foreign_key: { to_table: :matching_profiles, on_delete: :cascade }
      t.references :meetup, null: false, foreign_key: { on_delete: :cascade }
      t.datetime :sent_at, null: false
      t.timestamps
    end

    add_index :matching_welcomes,
              %i[sender_profile_id receiver_profile_id],
              unique: true,
              name: "idx_welcomes_on_sender_and_receiver"
    add_index :matching_welcomes,
              %i[meetup_id receiver_profile_id],
              name: "idx_welcomes_on_meetup_and_receiver"
  end
end

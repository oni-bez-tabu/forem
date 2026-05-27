class CreateMeetupMatchingDeclarations < ActiveRecord::Migration[7.0]
  def change
    create_table :meetup_matching_declarations do |t|
      t.references :meetup, null: false, foreign_key: { on_delete: :cascade }
      t.references :matching_profile, null: false, foreign_key: { on_delete: :cascade }
      t.string :intent_level, null: false
      t.jsonb :looking_for, null: false, default: []
      t.string :meetup_note
      t.timestamps
    end

    add_index :meetup_matching_declarations,
              %i[meetup_id matching_profile_id],
              unique: true,
              name: "idx_declarations_on_meetup_and_profile"
    add_index :meetup_matching_declarations,
              %i[meetup_id intent_level],
              name: "idx_declarations_on_meetup_and_intent"
  end
end

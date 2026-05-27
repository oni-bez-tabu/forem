class CreateMatchingRecommendationImpressions < ActiveRecord::Migration[7.0]
  def change
    create_table :matching_recommendation_impressions do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.references :meetup, null: false, foreign_key: { on_delete: :cascade }
      t.datetime :shown_at, null: false
      t.timestamps
    end

    add_index :matching_recommendation_impressions,
              %i[user_id meetup_id shown_at],
              name: "index_matching_rec_impressions_lookup"
    add_index :matching_recommendation_impressions,
              %i[user_id shown_at],
              name: "index_matching_rec_impressions_by_user_recency"
  end
end

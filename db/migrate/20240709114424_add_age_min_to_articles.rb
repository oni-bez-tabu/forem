class AddAgeMinToArticles < ActiveRecord::Migration[7.0]
  def change
    add_column :articles, :age_min, :integer, default: 0
  end
end

class AddVideoToTalks < ActiveRecord::Migration[7.0]
  def change
    add_column :talks, :video, :boolean, default: false, null: false
  end
end

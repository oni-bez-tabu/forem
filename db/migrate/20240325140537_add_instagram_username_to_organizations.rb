class AddInstagramUsernameToOrganizations < ActiveRecord::Migration[7.0]
  def change
    add_column :organizations, :instagram_username, :string
  end
end

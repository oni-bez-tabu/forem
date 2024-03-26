class AddTiktokUsernameToOrganizations < ActiveRecord::Migration[7.0]
  def change
    add_column :organizations, :tiktok_username, :string
  end
end

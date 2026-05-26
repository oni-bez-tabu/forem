class DropLegacyOrgSocialUsernameColumns < ActiveRecord::Migration[7.0]
  def change
    safety_assured do
      remove_column :organizations, :github_username, :string
      remove_column :organizations, :instagram_username, :string
      remove_column :organizations, :tiktok_username, :string
    end
  end
end

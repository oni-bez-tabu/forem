class AddSubforemIdToSettingsTalks < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_column :settings_talks, :subforem_id, :bigint unless column_exists?(:settings_talks, :subforem_id)

    # Usuń stary unikalny indeks po :var (concurrently)
    if index_exists?(:settings_talks, :var, name: "index_settings_talks_on_var")
      remove_index :settings_talks, :var, name: "index_settings_talks_on_var", algorithm: :concurrently
    end

    # Dodaj indeks pomocniczy po :subforem_id (concurrently)
    unless index_exists?(:settings_talks, :subforem_id, name: "index_settings_talks_on_subforem_id")
      add_index :settings_talks, :subforem_id, name: "index_settings_talks_on_subforem_id", algorithm: :concurrently
    end

    # Dodaj docelowy unikalny indeks złożony (concurrently)
    unless index_exists?(:settings_talks, [:var, :subforem_id], name: "index_settings_talks_on_var_and_subforem_id")
      add_index :settings_talks, [:var, :subforem_id], unique: true, name: "index_settings_talks_on_var_and_subforem_id", algorithm: :concurrently
    end
  end
end



class AddSubforemIdToSettingsTalks < ActiveRecord::Migration[7.0]
  def change
    add_column :settings_talks, :subforem_id, :bigint

    # Zmiana indeksów: poprzednio unikalny tylko po :var, teraz spójnie z innymi tabelami
    remove_index :settings_talks, :var
    add_index :settings_talks, :subforem_id
    add_index :settings_talks, [:var, :subforem_id], unique: true
  end
end



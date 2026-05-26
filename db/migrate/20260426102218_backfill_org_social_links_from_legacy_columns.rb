class BackfillOrgSocialLinksFromLegacyColumns < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    safety_assured do
      execute <<~SQL.squish
        UPDATE organizations
        SET social_links = social_links || jsonb_build_object(
          'instagram',
          'https://www.instagram.com/' || regexp_replace(instagram_username, '^@', '')
        )
        WHERE COALESCE(instagram_username, '') <> ''
          AND COALESCE(social_links->>'instagram', '') = ''
      SQL

      execute <<~SQL.squish
        UPDATE organizations
        SET social_links = social_links || jsonb_build_object(
          'tiktok',
          'https://www.tiktok.com/@' || regexp_replace(tiktok_username, '^@', '')
        )
        WHERE COALESCE(tiktok_username, '') <> ''
          AND COALESCE(social_links->>'tiktok', '') = ''
      SQL
    end
  end

  def down
    safety_assured do
      execute <<~SQL.squish
        UPDATE organizations
        SET social_links = social_links - 'instagram'
        WHERE social_links->>'instagram' LIKE 'https://www.instagram.com/%'
          AND COALESCE(instagram_username, '') <> ''
      SQL

      execute <<~SQL.squish
        UPDATE organizations
        SET social_links = social_links - 'tiktok'
        WHERE social_links->>'tiktok' LIKE 'https://www.tiktok.com/@%'
          AND COALESCE(tiktok_username, '') <> ''
      SQL
    end
  end
end

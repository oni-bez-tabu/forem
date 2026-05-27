module Notifications
  module Matching
    module NewPoolMember
      # Fires when a new MeetupMatchingDeclaration is created with an active
      # intent (open_to_meet / just_vibe). Notifies every other active member
      # of that meetup's pool ("their pool just grew"). Per SPEC §7.1 the new
      # joiner does NOT receive a notification about themselves.
      #
      # Push-only delivery (no in-app Notification row) — same pattern as
      # Forem's chat notifications: PushNotifications::Send runs, nothing is
      # written to the Notification table. The /matching timeline derives the
      # :match_found event on demand from the declarations themselves.
      module Send
        def self.call(new_declaration_id)
          new_declaration = MeetupMatchingDeclaration
            .includes(matching_profile: :user, meetup: :venue_city)
            .find_by(id: new_declaration_id)
          return unless new_declaration
          return if new_declaration.not_looking?

          new_profile = new_declaration.matching_profile
          return unless new_profile&.visible_to_others?

          meetup = new_declaration.meetup

          # Every other active pool member on this meetup.
          recipient_user_ids = MeetupMatchingDeclaration
            .joins(matching_profile: :user)
            .where(meetup_id: meetup.id)
            .where.not(intent_level: "not_looking")
            .where(matching_profile: { is_active: true, moderation_state: "approved" })
            .where.not(matching_profile_id: new_profile.id)
            .pluck("users.id")
            .uniq

          return if recipient_user_ids.empty?

          eligible_user_ids = Users::NotificationSetting
            .where(user_id: recipient_user_ids, notify_on_new_matches: true)
            .pluck(:user_id)
          return if eligible_user_ids.empty?

          ::I18n.with_locale(Settings::UserExperience.default_locale) do
            PushNotifications::Send.call(
              user_ids: eligible_user_ids,
              title: ::I18n.t("services.notifications.matching.new_pool_member.title", meetup: meetup.name),
              body: ::I18n.t("services.notifications.matching.new_pool_member.body"),
              payload: {
                url: "#{URL.url}/meetups/#{meetup.slug}",
                type: "matching_pool_member"
              },
            )
          end
        end
      end
    end
  end
end

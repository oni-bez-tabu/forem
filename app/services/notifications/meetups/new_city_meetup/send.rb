module Notifications
  module Meetups
    module NewCityMeetup
      # Fires when a Meetup transitions to published. Notifies every active
      # matching_profile whose city matches the meetup's venue_city
      # (or whose city is the special "everywhere" entry — per SPEC §7.1).
      #
      # Push-only delivery (no in-app Notification row) — same pattern as
      # Forem's chat notifications. Users see the event reflected as a
      # recommendation card in /matching, not in the global notifications inbox.
      module Send
        def self.call(meetup_id)
          meetup = ::Meetup
            .includes(:venue_city)
            .where(is_published: true)
            .find_by(id: meetup_id)
          return unless meetup
          return unless meetup.venue_city

          recipient_user_ids = ::MatchingProfile
            .visible_to_others
            .joins(:city)
            .where("cities.id = ? OR cities.is_special = ?", meetup.venue_city_id, true)
            .pluck(:user_id)
            .uniq
          return if recipient_user_ids.empty?

          eligible_user_ids = Users::NotificationSetting
            .where(user_id: recipient_user_ids, notify_on_new_city_meetups: true)
            .pluck(:user_id)
          return if eligible_user_ids.empty?

          ::I18n.with_locale(Settings::UserExperience.default_locale) do
            PushNotifications::Send.call(
              user_ids: eligible_user_ids,
              title: ::I18n.t("services.notifications.meetups.new_city_meetup.title",
                              city: meetup.venue_city.name),
              body: ::I18n.t("services.notifications.meetups.new_city_meetup.body",
                             name: meetup.name,
                             date: ::I18n.l(meetup.start_at, format: :short)),
              payload: {
                url: "#{URL.url}/meetups/#{meetup.slug}",
                type: "new_city_meetup"
              },
            )
          end
        end
      end
    end
  end
end

module Notifications
  module Meetups
    module NewCityMeetup
      # Fires when a Meetup transitions to published. Notifies every active
      # matching_profile whose city matches the meetup's venue_city
      # (or whose city is the special "everywhere" entry — per SPEC §7.1).
      module Send
        ACTION = "new_city_meetup".freeze
        NOTIFIABLE_TYPE = "Meetup".freeze

        def self.call(meetup_id)
          meetup = ::Meetup
            .includes(:venue_city)
            .where(is_published: true)
            .find_by(id: meetup_id)
          return unless meetup
          return unless meetup.venue_city

          recipient_user_ids = candidate_user_ids(meetup)
          return if recipient_user_ids.empty?

          eligible_user_ids = Users::NotificationSetting
            .where(user_id: recipient_user_ids, notify_on_new_city_meetups: true)
            .pluck(:user_id)
          return if eligible_user_ids.empty?

          ::I18n.with_locale(Settings::UserExperience.default_locale) do
            create_in_app_notifications(eligible_user_ids, meetup)
            push_to_devices(eligible_user_ids, meetup)
          end
        end

        def self.candidate_user_ids(meetup)
          ::MatchingProfile
            .visible_to_others
            .joins(:city)
            .where("cities.id = ? OR cities.is_special = ?", meetup.venue_city_id, true)
            .pluck(:user_id)
            .uniq
        end

        def self.create_in_app_notifications(user_ids, meetup)
          json_data = {
            meetup: {
              id: meetup.id,
              slug: meetup.slug,
              name: meetup.name,
              start_at: meetup.start_at.iso8601,
              city: meetup.venue_city.name,
            },
          }

          rows = user_ids.map do |uid|
            {
              user_id: uid,
              notifiable_id: meetup.id,
              notifiable_type: NOTIFIABLE_TYPE,
              action: ACTION,
              json_data: json_data,
              notified_at: Time.current,
              created_at: Time.current,
              updated_at: Time.current,
            }
          end

          ::Notification.insert_all(rows)
        end

        def self.push_to_devices(user_ids, meetup)
          PushNotifications::Send.call(
            user_ids: user_ids,
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

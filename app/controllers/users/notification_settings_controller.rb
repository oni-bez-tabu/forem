module Users
  class NotificationSettingsController < ApplicationController
    before_action :check_suspended
    before_action :authenticate_user!
    after_action :verify_authorized

    ALLOWED_PARAMS = %i[email_badge_notifications
                        email_chat_notifications
                        email_comment_notifications
                        email_community_mod_newsletter
                        email_digest_periodic
                        email_follower_notifications
                        email_membership_newsletter
                        email_mention_notifications
                        email_newsletter
                        email_tag_mod_newsletter
                        email_unread_notifications
                        mobile_chat_notifications
                        mobile_comment_notifications
                        mobile_mention_notifications
                        mod_roundrobin_notifications
                        notify_on_new_city_meetups
                        notify_on_new_matches
                        reaction_notifications
                        welcome_notifications].freeze
    ONBOARDING_ALLOWED_PARAMS = %i[email_newsletter email_digest_periodic].freeze

    def update
      authorize current_user, policy_class: UserPolicy

      if current_user.notification_setting.update(users_notification_setting_params)
        flash[:settings_notice] = I18n.t("users_controller.notifications_settings_updated")
      else
        Honeycomb.add_field("error", current_user.notification_setting.errors.messages.compact_blank)
        Honeycomb.add_field("errored", true)
        flash[:error] = current_user.notification_setting.errors_as_sentence
      end
      redirect_to user_settings_path(redirect_tab)
    end

    # Allow the form to roundtrip back to a non-default settings tab (e.g.,
    # the Matching tab uses this to keep the user on /settings/matching after
    # saving the matching-specific toggles). Whitelisted against TAB_LIST so
    # it can't be turned into an open-tab redirect.
    def redirect_tab
      requested = params[:return_to].to_s.downcase
      allowed = Constants::Settings::TAB_LIST.map { |t| t.downcase.tr(" ", "-") }
      allowed.include?(requested) ? requested : :notifications
    end

    private

    def render_update_response(success, errors = nil)
      status = success ? 200 : 422

      respond_to do |format|
        format.json { render json: { errors: errors }, status: status }
      end
    end

    def users_notification_setting_params
      params.require(:users_notification_setting).permit(ALLOWED_PARAMS)
    end
  end
end

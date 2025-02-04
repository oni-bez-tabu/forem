module Admin
    class TalksController < Admin::ApplicationController
      layout "admin"
  
      def index
        @talks = Talk.order(Arel.sql("CASE status 
          WHEN 2 THEN 1  /* started */
          WHEN 0 THEN 2  /* created */
          WHEN 1 THEN 3  /* scheduled */
          WHEN 3 THEN 4  /* finished */
          WHEN 4 THEN 5  /* banned */
          END"))
          .order(created_at: :desc)
          .page(params[:page]).per(50)
          .includes(:user)
      end
  
      def update_status
        @talk = Talk.find(params[:id])
        new_status = params[:status]
  
        case new_status
        when "finished"
          unless @talk.can_be_finished?
            render json: { error: I18n.t("admin.talks_controller.status_change_not_allowed") }, status: :unprocessable_entity
            return
          end
        when "banned"
          unless @talk.can_be_banned?
            render json: { error: I18n.t("admin.talks_controller.status_change_not_allowed") }, status: :unprocessable_entity
            return
          end
          
          response = Talks::BanUserService.call(@talk.channel_id)
          unless response[:success]
            render json: { error: "Nie udało się zbanować użytkownika w Agorze" }, status: :unprocessable_entity
            return
          end
        else
          render json: { error: I18n.t("admin.talks_controller.invalid_status") }, status: :unprocessable_entity
          return
        end
  
        if @talk.update(status: new_status)
          render json: { message: I18n.t("admin.talks_controller.status_updated") }, status: :ok
        else
          render json: { error: @talk.errors_as_sentence }, status: :unprocessable_entity
        end
      end
  
      private
  
      def authorize_admin
        authorize Talk, :access?, policy_class: InternalPolicy
      end
    end
  end
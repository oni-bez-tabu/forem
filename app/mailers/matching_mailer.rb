class MatchingMailer < ApplicationMailer
  def approved
    @profile = params[:profile]
    @user = @profile.user
    mail(to: @user.email, subject: I18n.t("matching_mailer.approved.subject"))
  end

  def rejected
    @profile = params[:profile]
    @user = @profile.user
    mail(to: @user.email, subject: I18n.t("matching_mailer.rejected.subject"))
  end
end

class TalkPolicy < ApplicationPolicy
  def create?
    return false unless user
 
    if Settings::Talk.admin_only_creation
      return user_any_admin?
    end

    require_user_in_good_standing!
    return user_any_admin? if ArticlePolicy.limit_post_creation_to_admins?

    user.created_at.before?(7.days.ago)
  end

  def destroy?
    return false unless user
    return false unless record.user_id == user.id
    record.can_be_removed?
  end
end 
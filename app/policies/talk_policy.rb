class TalkPolicy < ApplicationPolicy
  def create?
    require_user_in_good_standing!
    return false unless user&.created_at
    return user_any_admin? if ArticlePolicy.limit_post_creation_to_admins?

    user.created_at.before?(7.days.ago)
  end

  def update?
    user_any_admin?
  end

  def destroy?
    user_any_admin?
  end

  alias new? create?
  alias edit? update?
end 
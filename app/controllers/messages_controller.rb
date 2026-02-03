class MessagesController < ApplicationController
  before_action :authenticate_user!

  def show
    # Footer is hidden via CSS (see app/assets/stylesheets/views/footer.scss)
  end
end

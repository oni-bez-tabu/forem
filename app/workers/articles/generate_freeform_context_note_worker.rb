module Articles
  class GenerateFreeformContextNoteWorker
    include Sidekiq::Job
    sidekiq_options queue: :low_priority, lock: :until_executing

    def perform(article_id)
      return unless Ai::Base::DEFAULT_KEY.present?

      article = Article.find_by(id: article_id)
      return unless article
      return unless article.featured
      return if article.context_notes.exists?

      Ai::FreeformContextNoteGenerator.new(article).call
    end
  end
end

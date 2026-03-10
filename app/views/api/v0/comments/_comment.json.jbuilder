json.type_of "comment"
json.id_code comment.id_code_generated
json.id comment.id
json.created_at utc_iso_timestamp(comment.created_at)

if comment.deleted?
  json.body_html "<p>#{Comment.title_deleted}</p>"
  json.set! :user, {}
elsif comment.hidden_by_commentable_user?
  json.body_html "<p>#{Comment.title_hidden}</p>"
  json.set! :user, {}
else
  json.body_html comment.processed_html
  json.body_markdown comment.body_markdown
  json.user_id comment.user_id
  json.article_id comment.commentable_id if comment.commentable_type == "Article"
  json.partial! "api/v0/shared/user", user: comment.user
end

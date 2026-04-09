# config/puma.rb

# Puma can serve each request in a thread from an internal thread pool.
# The `threads` method setting takes two numbers: a minimum and maximum.
# Any libraries that use thread pools should be configured to match
# the maximum value specified for Puma. Default is set to 5 threads for minimum
# and maximum; this matches the default thread size of Active Record.
#
threads_count = ENV.fetch("RAILS_MAX_THREADS", 5).to_i
threads threads_count, threads_count

# Specifies the `port` that Puma will listen on to receive requests; default is 3000.
port ENV.fetch("PORT", 3000)

# Specifies the `environment` that Puma will run in.
environment ENV.fetch("RAILS_ENV", "production")

# Specifies the `pidfile` that Puma will use.
pidfile ENV.fetch("PIDFILE", "tmp/pids/server.pid")

# Workers:
# Use single worker in development for faster startup and less memory usage
rails_env = ENV.fetch("RAILS_ENV", "production")
if rails_env == "development"
  workers 0
else
  workers ENV.fetch("WEB_CONCURRENCY", 2).to_i
end

# Calls GC and compacts the heap before forking (only if you actually use the gem).
# Comment out if you don't have 'nakayoshi_fork' in your Gemfile.
# nakayoshi_fork

# Use the `preload_app!` method when specifying a `workers` number.
# Only preload outside development for faster development startup.
preload_app! unless rails_env == "development"

# Allow puma to be restarted by `rails restart` command.
plugin :tmp_restart

on_worker_boot do
  # Worker specific setup for Rails 4.1+
  # See: https://devcenter.heroku.com/articles/deploying-rails-applications-with-the-puma-web-server#on-worker-boot
  ActiveRecord::Base.establish_connection if defined?(ActiveRecord)
end

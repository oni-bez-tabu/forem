namespace :matching do
  desc "Seed demo matching profiles, RSVPs, and declarations for the two demo meetups. Idempotent."
  task seed_demo_data: :environment do
    abort "Refusing to run in production." if Rails.env.production?

    result = Meetups::DemoSeeder.call
    puts "Demo seed finished:"
    puts "  users created    : #{result.users_created}"
    puts "  profiles created : #{result.profiles_created}"
    puts "  rsvps created    : #{result.rsvps_created}"
    puts "  declarations     : #{result.declarations_created}"
  end

  desc "Seed timeline activity (RSVPs/declarations/welcomes/match notifications) for USER=<username>. Idempotent."
  task seed_timeline_for_user: :environment do
    abort "Refusing to run in production." if Rails.env.production?

    username = ENV["USER"] || ENV["USERNAME"]
    abort "Usage: dip rails matching:seed_timeline_for_user USER=<username>" if username.blank?

    result = Meetups::DemoSeeder.seed_timeline_for(username)
    puts "Timeline seed for '#{username}' finished:"
    puts "  rsvps created       : #{result.rsvps_created}"
    puts "  declarations created: #{result.declarations_created}"
    puts "  welcomes sent       : #{result.welcomes_sent}"
    puts "  welcomes received   : #{result.welcomes_received}"
    puts "  extra meetups       : #{result.extra_meetups}"
    puts "  stale notif. purged : #{result.stale_notifications_purged}"
  end
end

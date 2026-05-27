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
end

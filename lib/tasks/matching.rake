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

  desc "Wipe matching + meetup state, create 2 demo meetups, reseed demo profiles. Dev/test only. PRESERVE=user1,user2 keeps named users' profiles intact."
  task reset_demo: :environment do
    abort "Refusing to run in production." if Rails.env.production?

    preserved_usernames = (ENV["PRESERVE"] || "on_bez_tabu").split(",").map(&:strip).reject(&:blank?)
    preserved_user_ids = User.where(username: preserved_usernames).pluck(:id)
    preserved_profile_ids = MatchingProfile.where(user_id: preserved_user_ids).pluck(:id)
    puts "Preserving profiles for: #{preserved_usernames.join(', ').presence || '(none)'}" if preserved_user_ids.any?

    puts "Wiping matching + meetup state…"
    MatchingWelcome.where("sender_profile_id NOT IN (?) AND receiver_profile_id NOT IN (?)",
                          preserved_profile_ids + [0], preserved_profile_ids + [0]).delete_all
    MatchingRecommendationImpression.delete_all
    MeetupMatchingDeclaration.where.not(matching_profile_id: preserved_profile_ids).delete_all
    MatchingProfile.where.not(id: preserved_profile_ids).destroy_all
    MeetupRsvp.where.not(user_id: preserved_user_ids).delete_all
    Meetup.delete_all # also cascade-destroys remaining RSVPs/declarations on those meetups
    puts "  wiped."

    organizer = User.find_by(username: "on_bez_tabu") || User.order(:id).first
    abort "No user found to use as meetup organizer." unless organizer

    warsaw = City.find_by(name: "Warszawa") || raise("City 'Warszawa' missing — run cities:seed first")
    krakow = City.find_by(name: "Kraków") || warsaw

    puts "Creating demo meetups (organizer: @#{organizer.username})…"
    czerwony = Meetup.create!(
      name: "Czerwony Wieczór · BDSM Beginners",
      slug: "czerwony-wieczor-2026-06-14",
      venue_name: "Czerwona Kotwica",
      venue_city: warsaw,
      start_at: Time.zone.local(2026, 6, 14, 22, 0),
      end_at: Time.zone.local(2026, 6, 15, 2, 0),
      banner_gradient: "ember",
      description_link_type: "external",
      description_external_url: "https://example.com/czerwony-wieczor",
      is_published: true,
      organizer_user: organizer,
      created_by: organizer,
    )
    noc = Meetup.create!(
      name: "Noc nie!tabu · Kraków edition",
      slug: "noc-tabu-2026-06-20",
      venue_name: "Klub Kazimierz",
      venue_city: krakow,
      start_at: Time.zone.local(2026, 6, 20, 21, 0),
      end_at: Time.zone.local(2026, 6, 21, 3, 0),
      banner_gradient: "velvet",
      description_link_type: "external",
      description_external_url: "https://example.com/noc-tabu",
      is_published: true,
      organizer_user: organizer,
      created_by: organizer,
    )
    puts "  #{czerwony.slug}"
    puts "  #{noc.slug}"

    puts "Seeding demo profiles + RSVPs + declarations…"
    result = Meetups::DemoSeeder.call
    puts "  users:        #{result.users_created}"
    puts "  profiles:     #{result.profiles_created}"
    puts "  rsvps:        #{result.rsvps_created}"
    puts "  declarations: #{result.declarations_created}"

    puts ""
    puts "Done. Twoja kolej:"
    puts "  - /wydarzenia → publiczna lista (2 meetupy)"
    puts "  - Zaloguj się jako @#{organizer.username} — bez profilu /matching kieruje na onboarding,"
    puts "    stwórz profil żeby zobaczyć SPA dashboard z timeline + recommendations."
    puts "  - Demo users (anna_demo, kasia_demo, tomek_demo, …) hasło 'password'."
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

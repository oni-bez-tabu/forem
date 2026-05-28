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

    # ── Dodatkowe wydarzenia testowe pod recommendations ──
    # `MeetupRecommendations` wyklucza meetupy, na które user RSVP'ował,
    # więc tworzymy 2 wydarzenia BEZ udziału preserved usera. Pierwsze ma
    # organizera = preserved user (= repeat_organizer bonus). Drugie ma
    # organizera demo. Oba w Warszawie, więc widoczne dla profilu warszawskiego.
    anna = User.find_by(username: "anna_demo")
    if anna
      warsztat = Meetup.create!(
        name: "Warsztat negocjacji granic",
        slug: "warsztat-granic-2026-07-05",
        venue_name: "Bar Sztabowa",
        venue_city: warsaw,
        start_at: Time.zone.local(2026, 7, 5, 18, 0),
        end_at: Time.zone.local(2026, 7, 5, 21, 30),
        banner_gradient: "sunrise",
        description_link_type: "external",
        description_external_url: "https://example.com/warsztat-granic",
        is_published: true,
        organizer_user: organizer, # = repeat_organizer bonus
        created_by: organizer,
      )
      open_table = Meetup.create!(
        name: "Otwarty stół · pierwsze rozmowy",
        slug: "otwarty-stol-2026-07-12",
        venue_name: "Kawiarnia Powiśle",
        venue_city: warsaw,
        start_at: Time.zone.local(2026, 7, 12, 19, 0),
        end_at: Time.zone.local(2026, 7, 12, 22, 0),
        banner_gradient: "dusk",
        description_link_type: "external",
        description_external_url: "https://example.com/otwarty-stol",
        is_published: true,
        organizer_user: anna, # inny organizer = bez bonus
        created_by: anna,
      )

      # Seed deklaracje na nowych meetupach: warsztat ma "głośniejszy" pool
      # (8 deklaracji), otwarty stół skromniejszy (4). Różne identity types,
      # różne intent levels, żeby identity_breakdown miał sens w UI.
      extra_seeds = [
        [warsztat,   "kasia_demo",    "open_to_meet"],
        [warsztat,   "tomek_demo",    "open_to_meet"],
        [warsztat,   "para_a_demo",   "open_to_meet"],
        [warsztat,   "alex_demo",     "open_to_meet"],
        [warsztat,   "natalia_demo",  "just_vibe"],
        [warsztat,   "adam_demo",     "open_to_meet"],
        [warsztat,   "jules_demo",    "open_to_meet"],
        [warsztat,   "iza_demo",      "just_vibe"],
        [open_table, "ola_demo",      "open_to_meet"],
        [open_table, "filip_demo",    "open_to_meet"],
        [open_table, "para_e_demo",   "just_vibe"],
        [open_table, "sam_demo",      "open_to_meet"],
      ]
      extras_created = 0
      extra_seeds.each do |(meetup, username, intent)|
        u = User.find_by(username: username) or next
        profile = MatchingProfile.find_by(user_id: u.id) or next
        MeetupRsvp.find_or_create_by!(meetup: meetup, user: u) { |r| r.status = "going" }
        MeetupMatchingDeclaration.find_or_create_by!(meetup: meetup, matching_profile: profile) do |d|
          d.intent_level = intent
          d.meetup_note = case intent
                          when "open_to_meet" then "Chętnie się poznam — pisz."
                          when "just_vibe"    then "Wpadam pochłonąć atmosferę."
                          end
        end
        extras_created += 1
      end
      puts "Extra meetups: #{warsztat.slug} (#{extras_created.then { 8 }} decls, repeat_organizer), #{open_table.slug} (4 decls)"
    end

    # TimelineFeed#match_found_events shows joiners whose declaration is newer
    # than viewer's. Backdate preserved users' declarations so demo joiners
    # appear as fresh matches in the timeline. No-op if preserved user has
    # no declarations yet.
    if preserved_user_ids.any?
      preserved_decls = MeetupMatchingDeclaration
        .joins(:matching_profile)
        .where(matching_profile: { user_id: preserved_user_ids })
      if preserved_decls.exists?
        backdate_to = 2.days.ago
        preserved_decls.update_all(created_at: backdate_to, updated_at: backdate_to)
        puts "Backdated #{preserved_decls.count} preserved declaration(s) by 2 days so demo joiners surface as match_found events."
      end
    end

    puts ""
    puts "Done. Twoja kolej:"
    puts "  - /meetups → publiczna lista (4 meetupy)"
    puts "  - Zaloguj się jako @#{organizer.username}. /matching pokaże dashboard z:"
    puts "      timeline (match_found z czerwony + noc) + recommendations (warsztat + otwarty stół)."
    puts "  - warsztat-granic ma repeat_organizer bonus (Ty jesteś organizatorem),"
    puts "    otwarty-stol bez bonusa — ranking widoczny w 'Bo:' caption."
    puts "  - Demo users (anna_demo, …) hasło 'password'."
  end

  desc "Dodaj 2 dodatkowe meetupy (warsztat-granic + otwarty-stol) z seedem deklaracji, bez kasowania istniejących danych. Idempotent."
  task add_extra_meetups: :environment do
    abort "Refusing to run in production." if Rails.env.production?

    organizer = User.find_by(username: "on_bez_tabu") || User.order(:id).first
    abort "No user to use as organizer." unless organizer
    anna = User.find_by(username: "anna_demo")
    abort "anna_demo user missing — run matching:reset_demo first." unless anna
    warsaw = City.find_by(name: "Warszawa") || raise("City 'Warszawa' missing")

    warsztat = Meetup.find_by(slug: "warsztat-granic-2026-07-05") || Meetup.create!(
      name: "Warsztat negocjacji granic",
      slug: "warsztat-granic-2026-07-05",
      venue_name: "Bar Sztabowa",
      venue_city: warsaw,
      start_at: Time.zone.local(2026, 7, 5, 18, 0),
      end_at: Time.zone.local(2026, 7, 5, 21, 30),
      banner_gradient: "sunrise",
      description_link_type: "external",
      description_external_url: "https://example.com/warsztat-granic",
      is_published: true,
      organizer_user: organizer,
      created_by: organizer,
    )
    open_table = Meetup.find_by(slug: "otwarty-stol-2026-07-12") || Meetup.create!(
      name: "Otwarty stół · pierwsze rozmowy",
      slug: "otwarty-stol-2026-07-12",
      venue_name: "Kawiarnia Powiśle",
      venue_city: warsaw,
      start_at: Time.zone.local(2026, 7, 12, 19, 0),
      end_at: Time.zone.local(2026, 7, 12, 22, 0),
      banner_gradient: "dusk",
      description_link_type: "external",
      description_external_url: "https://example.com/otwarty-stol",
      is_published: true,
      organizer_user: anna,
      created_by: anna,
    )

    extra_seeds = [
      [warsztat,   "kasia_demo",    "open_to_meet"],
      [warsztat,   "tomek_demo",    "open_to_meet"],
      [warsztat,   "para_a_demo",   "open_to_meet"],
      [warsztat,   "alex_demo",     "open_to_meet"],
      [warsztat,   "natalia_demo",  "just_vibe"],
      [warsztat,   "adam_demo",     "open_to_meet"],
      [warsztat,   "jules_demo",    "open_to_meet"],
      [warsztat,   "iza_demo",      "just_vibe"],
      [open_table, "ola_demo",      "open_to_meet"],
      [open_table, "filip_demo",    "open_to_meet"],
      [open_table, "para_e_demo",   "just_vibe"],
      [open_table, "sam_demo",      "open_to_meet"],
    ]
    extras = 0
    extra_seeds.each do |(meetup, username, intent)|
      u = User.find_by(username: username) or next
      profile = MatchingProfile.find_by(user_id: u.id) or next
      MeetupRsvp.find_or_create_by!(meetup: meetup, user: u) { |r| r.status = "going" }
      MeetupMatchingDeclaration.find_or_create_by!(meetup: meetup, matching_profile: profile) do |d|
        d.intent_level = intent
        d.meetup_note = intent == "open_to_meet" ? "Chętnie się poznam — pisz." : "Wpadam pochłonąć atmosferę."
      end
      extras += 1
    end

    puts "✓ #{warsztat.slug} (organizer @#{organizer.username} = repeat_organizer bonus)"
    puts "✓ #{open_table.slug} (organizer @#{anna.username})"
    puts "Seeded/ensured #{extras} declarations across both meetups."
    puts "Recommendations w /matching: jeśli nie masz RSVP na te 2 meetupy, pojawią się w sekcji rekomendacji."
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

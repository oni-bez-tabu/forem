module Meetups
  # Seeds a realistic-looking pool of users, matching profiles, RSVPs, and
  # declarations across the two demo meetups so the Matching POC has enough
  # data to exercise PoolFinder grouping, F' blur, and event-scoped profiles.
  # Idempotent — re-running is a no-op for already-seeded usernames.
  class DemoSeeder
    PHOTO_FIXTURE = Rails.root.join("spec/fixtures/files/800x600.png").freeze

    # Each row: [username, identity, city_slug, bio, intent, meetups, moderation]
    # meetups: :both | :czerwony | :noc
    # moderation: :approved | :pending | :rejected
    PEOPLE = [
      ["anna_demo",   "woman",      "warszawa", "Sztuka, taneczne wieczory, dobre wino. Dam znać kiedy ci powiem coś niespodziewanego.", "open_to_meet", :both,     :approved],
      ["kasia_demo",  "woman",      "warszawa", "Otwarta, lubię konwersacje na poważnie.",                                                  "open_to_meet", :both,     :approved],
      ["magda_demo",  "woman",      "krakow",   "Introwertyk ale potrafię się rozkręcić.",                                                  "just_vibe",    :czerwony, :approved],
      ["ola_demo",    "woman",      "wroclaw",  "Energia plus dobra kawa = ja.",                                                            "open_to_meet", :both,     :approved],
      ["maja_demo",   "woman",      "warszawa", "Lubię nieoczywiste miejsca i dziwne pytania.",                                             "open_to_meet", :noc,      :approved],

      ["tomek_demo",  "man",        "warszawa", "Architekt, miłośnik miasta. Mogę cię oprowadzić.",                                         "open_to_meet", :both,     :approved],
      ["piotr_demo",  "man",        "warszawa", "Lubię niespodzianki i osoby z dystansem.",                                                 "open_to_meet", :czerwony, :approved],
      ["kuba_demo",   "man",        "gdansk",   "Słońce, morze, dobrze gadam o niczym.",                                                    "just_vibe",    :both,     :approved],
      ["marcin_demo", "man",        "krakow",   "Trochę psycholog, trochę filozof.",                                                        "open_to_meet", :czerwony, :approved],
      ["bartek_demo", "man",        "warszawa", "Programista. Lubię gry planszowe i głębokie rozmowy.",                                     "open_to_meet", :noc,      :approved],

      ["para_a_demo", "couple",     "warszawa", "Dziesięć lat razem, otwarci na nowych ludzi.",                                             "open_to_meet", :both,     :approved],
      ["para_b_demo", "couple",     "poznan",   "Lubimy się bawić w grupie. Nie naciskamy.",                                                "just_vibe",    :noc,      :approved],
      ["para_c_demo", "couple",     "warszawa", "Świeżo otwarci. Małe kroki.",                                                              "open_to_meet", :czerwony, :approved],

      ["alex_demo",   "non_binary", "everywhere", "Pisz do mnie, sprawdzimy chemię. Dystans nie problem.",                                  "open_to_meet", :both,     :approved],
      ["mika_demo",   "non_binary", "wroclaw",  "Trochę nerd, trochę queer.",                                                               "open_to_meet", :czerwony, :approved],
      ["sam_demo",    "non_binary", "warszawa", "Lubię ciszę i głośne koncerty na zmianę.",                                                 "just_vibe",    :both,     :approved],

      ["zofia_demo",  "woman",      "warszawa", "Świeżo na nietabu, czekam na akceptację.",                                                 "open_to_meet", :czerwony, :pending],
      ["rafal_demo",  "man",        "warszawa", "Hej. Brak bio.",                                                                            "open_to_meet", nil,       :rejected],

      # ── Druga fala: więcej osób gotowych na poznanie na obu wydarzeniach ──
      ["natalia_demo", "woman",      "warszawa", "Lubię cisze i sjestę, ale na evencie się rozkręcam.",                                       "open_to_meet", :both,     :approved],
      ["zuzia_demo",   "woman",      "warszawa", "Tańczę, czytam, gotuję — nieoczywiste połączenie.",                                          "open_to_meet", :czerwony, :approved],
      ["ada_demo",     "woman",      "krakow",   "Wracam do siebie. Patrzę na ludzi z ciekawością.",                                           "just_vibe",    :both,     :approved],
      ["iza_demo",     "woman",      "warszawa", "Nauczyłam się mówić nie. Łatwiej mi teraz mówić tak.",                                       "open_to_meet", :noc,      :approved],
      ["wiktoria_demo","woman",      "wroclaw",  "Otwarta na rozmowy bez tematów do końca przewidywalnych.",                                   "open_to_meet", :czerwony, :approved],

      ["adam_demo",    "man",        "warszawa", "Lubię ludzi którzy nie biorą siebie zbyt poważnie.",                                         "open_to_meet", :both,     :approved],
      ["michal_demo",  "man",        "krakow",   "Były kucharz, obecnie projektant. Lubię opowiadać historie.",                                "open_to_meet", :czerwony, :approved],
      ["filip_demo",   "man",        "warszawa", "Trening, książki, długie spacery. Wieczorem rzadziej, ale na evencie chętnie.",              "open_to_meet", :both,     :approved],
      ["lukasz_demo",  "man",        "gdansk",   "Daleko mi do Warszawy, ale na ten event jadę specjalnie.",                                   "just_vibe",    :czerwony, :approved],
      ["jan_demo",     "man",        "warszawa", "Pierwszy raz na nietabu. Chętnie kogoś poznam.",                                              "open_to_meet", :noc,      :approved],

      ["para_d_demo",  "couple",     "krakow",   "Pięć lat razem. Lubimy zaczynać znajomości od muzyki.",                                       "open_to_meet", :both,     :approved],
      ["para_e_demo",  "couple",     "warszawa", "Dwa lata razem, otwarci na nową energię.",                                                    "open_to_meet", :noc,      :approved],

      ["jules_demo",   "non_binary", "warszawa", "Ciekawość ponad wszystko. Spotkajmy się przy barze.",                                         "open_to_meet", :both,     :approved],
      ["robi_demo",    "non_binary", "krakow",   "Lubię cisze, dobre rozmowy, krótkie tańce.",                                                  "just_vibe",    :czerwony, :approved],
      ["lev_demo",     "non_binary", "everywhere","Mieszkam pomiędzy miastami. Łatwo znajdziesz mnie po kapeluszu.",                            "open_to_meet", :noc,      :approved]
    ].freeze

    Result = Struct.new(:users_created, :profiles_created, :rsvps_created, :declarations_created, keyword_init: true)

    def self.call
      new.call
    end

    def call
      czerwony = Meetup.find_by(slug: "czerwony-wieczor-2026-06-14") || raise("Missing meetup 'czerwony-wieczor-2026-06-14'. Seed meetups first.")
      noc      = Meetup.find_by(slug: "noc-tabu-2026-06-20")       || raise("Missing meetup 'noc-tabu-2026-06-20'. Seed meetups first.")

      counters = { users: 0, profiles: 0, rsvps: 0, declarations: 0 }

      PEOPLE.each do |row|
        username, identity, city_slug, bio, intent, meetups_key, moderation = row
        next if MatchingProfile.joins(:user).exists?(users: { username: username })

        city = City.find_by(slug: city_slug) || raise("City '#{city_slug}' missing — run cities:seed first")
        user = upsert_user(username)
        counters[:users] += 1 if user.previously_new_record?

        profile = upsert_profile(user: user, identity: identity, city: city, bio: bio, moderation: moderation)
        counters[:profiles] += 1

        meetups = case meetups_key
                  when :both then [czerwony, noc]
                  when :czerwony then [czerwony]
                  when :noc then [noc]
                  else []
                  end

        meetups.each do |meetup|
          attend(meetup: meetup, user: user, profile: profile, intent: intent, counters: counters)
        end
      end

      Result.new(
        users_created: counters[:users],
        profiles_created: counters[:profiles],
        rsvps_created: counters[:rsvps],
        declarations_created: counters[:declarations],
      )
    end

    private

    def upsert_user(username)
      user = User.find_by(username: username)
      return user if user

      User.create!(
        name: username.tr("_", " ").titleize,
        username: username,
        email: "#{username}@demo.test",
        profile_image: Rack::Test::UploadedFile.new(PHOTO_FIXTURE, "image/png"),
        confirmed_at: Time.current,
        registered_at: Time.current,
        registered: true,
        password: "password",
        password_confirmation: "password",
      )
    end

    def upsert_profile(user:, identity:, city:, bio:, moderation:)
      MatchingProfile.find_by(user_id: user.id) || begin
        profile = MatchingProfile.new(
          user: user,
          identity_type: identity,
          city: city,
          bio: bio,
          is_active: true,
          moderation_state: moderation.to_s,
        )
        profile.photo = File.open(PHOTO_FIXTURE)
        profile.save!
        profile
      end
    end

    def attend(meetup:, user:, profile:, intent:, counters:)
      rsvp = MeetupRsvp.find_or_initialize_by(meetup: meetup, user: user)
      if rsvp.new_record?
        rsvp.status = "going"
        rsvp.save!
        counters[:rsvps] += 1
      end

      return unless profile.visible_to_others? # pending/rejected profiles don't declare

      dec = MeetupMatchingDeclaration.find_or_initialize_by(meetup: meetup, matching_profile: profile)
      if dec.new_record?
        dec.intent_level = intent
        dec.meetup_note = note_for(intent, meetup)
        dec.save!
        counters[:declarations] += 1
      end
    end

    def note_for(intent, meetup)
      case intent
      when "open_to_meet" then "Idę na #{meetup.name.downcase} — chętnie się poznam."
      when "just_vibe"    then "Wpadam pochłonąć atmosferę."
      else nil
      end
    end

    public

    # ------------------------------------------------------------------
    # Per-user timeline seeder: gives a real (logged-in) user enough
    # activity so the E8 timeline has visible content. Idempotent —
    # finds_or_creates everything keyed by username.
    # ------------------------------------------------------------------
    TimelineResult = Struct.new(
      :rsvps_created, :declarations_created,
      :welcomes_sent, :welcomes_received,
      :extra_meetups, :stale_notifications_purged,
      keyword_init: true,
    )

    def self.seed_timeline_for(username)
      new.seed_timeline_for(username)
    end

    def seed_timeline_for(username)
      user = User.find_by(username: username) || raise("User '#{username}' not found")
      profile = MatchingProfile.find_by(user_id: user.id)
      raise "User '#{username}' has no MatchingProfile yet — create one via /matching/onboarding first" unless profile
      raise "User '#{username}' profile is not approved+active (state=#{profile.moderation_state}, active=#{profile.is_active?})" unless profile.visible_to_others?

      meetups = [
        Meetup.find_by(slug: "czerwony-wieczor-2026-06-14"),
        Meetup.find_by(slug: "noc-tabu-2026-06-20"),
      ].compact
      raise "No demo meetups found — run matching:seed_demo_data first" if meetups.empty?

      counters = {
        rsvps: 0, declarations: 0,
        welcomes_sent: 0, welcomes_received: 0,
        extra_meetups: 0, stale_notifications_purged: 0
      }

      # Purge stale matching_pool_member / new_city_meetup notification rows
      # left behind by older seed runs (we no longer write to the Notification
      # table — TimelineFeed derives match_found events from declarations).
      counters[:stale_notifications_purged] = Notification
        .where(user_id: user.id, action: %w[matching_pool_member new_city_meetup])
        .delete_all

      # Seed 5 extra upcoming meetups so the recommendations panel has
      # content even after the user RSVPs on the two demo meetups.
      counters[:extra_meetups] = seed_extra_upcoming_meetups(in_city: profile.city)

      # Backdate the user's RSVPs + declarations a few days so the *demo*
      # declarations (created earlier in clock time but pushed in via
      # seed_demo_data BEFORE this user existed) read as "joined the pool
      # after me" — that's what surfaces the match_found timeline rows.
      backdate = 3.days.ago
      meetups.each_with_index do |meetup, idx|
        rsvp = MeetupRsvp.find_or_initialize_by(meetup: meetup, user: user)
        if rsvp.new_record?
          rsvp.status = idx.zero? ? "going" : "interested"
          rsvp.save!
          rsvp.update_columns(created_at: backdate, updated_at: backdate)
          counters[:rsvps] += 1
        end

        dec = MeetupMatchingDeclaration.find_or_initialize_by(meetup: meetup, matching_profile: profile)
        if dec.new_record?
          dec.intent_level = idx.zero? ? "open_to_meet" : "just_vibe"
          dec.meetup_note = note_for(dec.intent_level, meetup)
          dec.save!
          dec.update_columns(created_at: backdate, updated_at: backdate)
          counters[:declarations] += 1
        end
      end

      # Welcomes sent by the user → 2 demo profiles (different meetups)
      czerwony = meetups.find { |m| m.slug == "czerwony-wieczor-2026-06-14" }
      noc      = meetups.find { |m| m.slug == "noc-tabu-2026-06-20" }
      receivers = candidate_receivers(profile, czerwony || noc, count: 2)
      receivers.each_with_index do |rec, i|
        meetup_for_welcome = (czerwony && i.even?) ? czerwony : (noc || czerwony)
        next unless meetup_for_welcome

        if MatchingWelcome.exists_between?(profile, rec)
          # already there from a prior seed run — skip
          next
        end

        MatchingWelcome.create!(
          sender_profile: profile,
          receiver_profile: rec,
          meetup: meetup_for_welcome,
          sent_at: (i + 1).hours.ago,
        )
        counters[:welcomes_sent] += 1
      end

      # Welcomes received from 2 other demo profiles
      senders = candidate_senders(profile, czerwony || noc, count: 2)
      senders.each_with_index do |sender, i|
        meetup_for_welcome = (czerwony && i.even?) ? czerwony : (noc || czerwony)
        next unless meetup_for_welcome
        next if MatchingWelcome.exists_between?(sender, profile)

        MatchingWelcome.create!(
          sender_profile: sender,
          receiver_profile: profile,
          meetup: meetup_for_welcome,
          sent_at: (i + 3).hours.ago,
        )
        counters[:welcomes_received] += 1
      end

      # match_found rows are derived on demand by Matching::TimelineFeed from
      # the demo declarations (whose created_at is now > the backdated viewer
      # declaration's created_at). Nothing to write here.

      TimelineResult.new(
        rsvps_created: counters[:rsvps],
        declarations_created: counters[:declarations],
        welcomes_sent: counters[:welcomes_sent],
        welcomes_received: counters[:welcomes_received],
        extra_meetups: counters[:extra_meetups],
        stale_notifications_purged: counters[:stale_notifications_purged],
      )
    end

    EXTRA_UPCOMING = [
      ["Wieczór planszówek",   9, "Klub Hybrydy"],
      ["Karaoke nietabu",     14, "Pawilony"],
      ["Speed friends",       21, "Kawiarnia Lokal"],
      ["Sauna i poznawanie",  28, "Banya"],
      ["Niedzielne śniadanie", 35, "Café Próżna"]
    ].freeze

    def seed_extra_upcoming_meetups(in_city:)
      # Special "everywhere" city profiles still need a concrete city for
      # the meetup venue — fall back to Warszawa, the most likely default.
      target_city = in_city.is_special? ? (City.find_by(slug: "warszawa") || in_city) : in_city
      organizer = User.find_by(username: "bartek_demo") || User.first

      created = 0
      EXTRA_UPCOMING.each do |name, days_ahead, venue|
        slug = "#{ActiveSupport::Inflector.parameterize(name)}-#{days_ahead.days.from_now.to_date.iso8601}"
        next if Meetup.exists?(slug: slug)

        start_at = days_ahead.days.from_now.change(hour: 19, min: 0)
        Meetup.create!(
          name: name,
          venue_name: venue,
          venue_city: target_city,
          start_at: start_at,
          end_at: start_at + 3.hours,
          banner_gradient: Meetup::BANNER_GRADIENTS.sample,
          description_link_type: "external",
          description_external_url: "https://example.com/event/#{slug}",
          is_published: true,
          created_by: organizer,
          organizer_user: organizer,
        )
        created += 1

        # Add 2–4 sample declarations so the activity-count sort has signal.
        meetup = Meetup.find_by!(slug: slug)
        candidates = MatchingProfile
          .visible_to_others
          .joins(:city)
          .where("cities.id = ? OR cities.is_special = ?", target_city.id, true)
          .order(Arel.sql("RANDOM()"))
          .limit(rand(2..4))
        candidates.each do |p|
          MeetupRsvp.find_or_create_by!(meetup: meetup, user: p.user) { |r| r.status = "going" }
          MeetupMatchingDeclaration.find_or_create_by!(meetup: meetup, matching_profile: p) do |d|
            d.intent_level = %w[open_to_meet just_vibe].sample
            d.meetup_note = note_for(d.intent_level, meetup)
          end
        end
      end

      created
    end

    def candidate_receivers(viewer_profile, meetup, count:)
      MatchingProfile
        .visible_to_others
        .where.not(id: viewer_profile.id)
        .joins(:matching_declarations)
        .where(meetup_matching_declarations: { meetup_id: meetup.id })
        .where.not(meetup_matching_declarations: { intent_level: "not_looking" })
        .limit(count)
        .to_a
    end

    def candidate_senders(viewer_profile, meetup, count:)
      MatchingProfile
        .visible_to_others
        .where.not(id: viewer_profile.id)
        .joins(:matching_declarations)
        .where(meetup_matching_declarations: { meetup_id: meetup.id })
        .where.not(meetup_matching_declarations: { intent_level: "not_looking" })
        .order(id: :desc)
        .limit(count)
        .to_a
    end
  end
end

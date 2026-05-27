module Meetups
  # Seeds a realistic-looking pool of users, matching profiles, RSVPs, and
  # declarations across the two demo meetups so the Matching POC has enough
  # data to exercise PoolFinder grouping, F' blur, and event-scoped profiles.
  # Idempotent — re-running is a no-op for already-seeded usernames.
  class DemoSeeder
    PHOTO_FIXTURE = Rails.root.join("spec/fixtures/files/800x600.png").freeze

    # Each row: [username, identity, city_slug, bio, intent, looking_for, meetups, moderation]
    # meetups: :both | :czerwony | :noc
    # moderation: :approved | :pending | :rejected
    PEOPLE = [
      ["anna_demo",   "woman",      "warszawa", "Sztuka, taneczne wieczory, dobre wino. Dam znać kiedy ci powiem coś niespodziewanego.", "open_to_meet", %w[man non_binary], :both, :approved],
      ["kasia_demo",  "woman",      "warszawa", "Otwarta, lubię konwersacje na poważnie.",                                                  "open_to_meet", %w[woman man],     :both, :approved],
      ["magda_demo",  "woman",      "krakow",   "Introwertyk ale potrafię się rozkręcić.",                                                  "just_vibe",    [],                  :czerwony, :approved],
      ["ola_demo",    "woman",      "wroclaw",  "Energia plus dobra kawa = ja.",                                                            "open_to_meet", %w[man couple],    :both, :approved],
      ["maja_demo",   "woman",      "warszawa", "Lubię nieoczywiste miejsca i dziwne pytania.",                                             "open_to_meet", %w[woman non_binary], :noc, :approved],

      ["tomek_demo",  "man",        "warszawa", "Architekt, miłośnik miasta. Mogę cię oprowadzić.",                                         "open_to_meet", %w[woman couple],  :both, :approved],
      ["piotr_demo",  "man",        "warszawa", "Lubię niespodzianki i osoby z dystansem.",                                                 "open_to_meet", %w[woman],         :czerwony, :approved],
      ["kuba_demo",   "man",        "gdansk",   "Słońce, morze, dobrze gadam o niczym.",                                                    "just_vibe",    [],                  :both, :approved],
      ["marcin_demo", "man",        "krakow",   "Trochę psycholog, trochę filozof.",                                                        "open_to_meet", %w[woman non_binary], :czerwony, :approved],
      ["bartek_demo", "man",        "warszawa", "Programista. Lubię gry planszowe i głębokie rozmowy.",                                     "open_to_meet", %w[woman man],     :noc, :approved],

      ["para_a_demo", "couple",     "warszawa", "Dziesięć lat razem, otwarci na nowych ludzi.",                                             "open_to_meet", %w[woman man],     :both, :approved],
      ["para_b_demo", "couple",     "poznan",   "Lubimy się bawić w grupie. Nie naciskamy.",                                                "just_vibe",    [],                  :noc, :approved],
      ["para_c_demo", "couple",     "warszawa", "Świeżo otwarci. Małe kroki.",                                                              "open_to_meet", %w[couple woman],  :czerwony, :approved],

      ["alex_demo",   "non_binary", "everywhere", "Pisz do mnie, sprawdzimy chemię. Dystans nie problem.",                                  "open_to_meet", %w[woman man non_binary], :both, :approved],
      ["mika_demo",   "non_binary", "wroclaw",  "Trochę nerd, trochę queer.",                                                               "open_to_meet", %w[non_binary woman], :czerwony, :approved],
      ["sam_demo",    "non_binary", "warszawa", "Lubię ciszę i głośne koncerty na zmianę.",                                                 "just_vibe",    [],                  :both, :approved],

      ["zofia_demo",  "woman",      "warszawa", "Świeżo na nietabu, czekam na akceptację.",                                                 "open_to_meet", %w[man],           :czerwony, :pending],
      ["rafal_demo",  "man",        "warszawa", "Hej. Brak bio.",                                                                            "open_to_meet", %w[woman],         nil,      :rejected]
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
        username, identity, city_slug, bio, intent, looking_for, meetups_key, moderation = row
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
          attend(meetup: meetup, user: user, profile: profile, intent: intent, looking_for: looking_for, counters: counters)
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

    def attend(meetup:, user:, profile:, intent:, looking_for:, counters:)
      rsvp = MeetupRsvp.find_or_initialize_by(meetup: meetup, user: user)
      if rsvp.new_record?
        rsvp.status = looking_for.empty? ? "going" : "going"
        rsvp.save!
        counters[:rsvps] += 1
      end

      return unless profile.visible_to_others? # pending/rejected profiles don't declare

      dec = MeetupMatchingDeclaration.find_or_initialize_by(meetup: meetup, matching_profile: profile)
      if dec.new_record?
        dec.intent_level = intent
        dec.looking_for = looking_for
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
  end
end

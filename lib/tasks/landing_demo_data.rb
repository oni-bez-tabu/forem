# Buduje pokazowa strone "landing-data" z realnych tresci z bazy.
# Uruchamiane przez rails runner.

def plural(n, one, few, many)
  return "#{n} #{one}" if n == 1
  return "#{n} #{few}" if [2, 3, 4].include?(n % 10) && !(12..14).cover?(n % 100)

  "#{n} #{many}"
end

# Tylko posty, ktore maja co pokazac: okladke albo wideo. Bierzemy oba rodzaje,
# zeby karuzela miala i miniatury, i materialy z ikona odtwarzania.
z_wideo   = Article.published.featured.where.not(video: [nil, ""]).order(published_at: :desc).limit(4)
z_okladka = Article.published.featured.where.not(main_image: [nil, ""]).order(published_at: :desc).limit(10)
articles  = (z_wideo.to_a + z_okladka.to_a).uniq(&:id).sort_by { |a| -a.published_at.to_i }.first(10)

posts = articles.map do |a|
  tags = a.cached_tag_list.to_s.split(",").map(&:strip).reject(&:empty?)
  cover = a.main_image.presence
  {
    "author" => a.user&.name.presence || a.user&.username,
    "title" => a.title,
    # Wideo ma wlasna miniature i czas trwania; pozostale posty pokazuja okladke.
    "image" => a.video.present? ? (a.video_thumbnail_url.presence || cover) : cover,
    "video" => a.video.present?,
    "duration" => (a.video_duration_in_minutes.to_s.presence if a.video.present?),
    "url" => a.path,
    "note" => "Zobacz post",
    "tags" => tags.first(2).map { |t| "##{t}" }.join("  "),
    "avatar" => nil
  }.compact
end

profiles = User.where.not(profile_image: [nil, ""])
  .order(articles_count: :desc).limit(4).map do |u|
  {
    "name" => u.name.presence || u.username,
    "handle" => u.username,
    "description" => u.profile&.summary.presence || "Autor w nie!tabu.",
    "src" => u.profile_image_url
  }
end

OPISY = {
  "relacje" => "Rozmowy o relacjach i komunikacji.",
  "zwiazek" => "Codzienność, bliskość i bycie razem.",
  "bdsm" => "Praktyki, granice i świadoma zgoda.",
  "poradnik" => "Konkretna wiedza od praktyków.",
  "przyjemnosc" => "Odkrywanie tego, co sprawia przyjemność.",
  "kobieta" => "O kobietach, dla kobiet i nie tylko.",
  "lgbt" => "Tożsamość, akceptacja i widoczność.",
  "masturbacja" => "Poznawanie własnego ciała.",
  "edukacjaseksualna" => "Wiedza, która pomaga lepiej rozumieć.",
  "kamasutra" => "Pozycje, technika i praktyka.",
  "swingerskistylzycia" => "Swingowanie w każdej odsłonie.",
  "seks" => "Rozmowy o seksie bez owijania."
}.freeze

# Osiem najczesciej uzywanych tagow, dobranych tak, by nie kolidowaly z czterema
# wyblaklymi zajawkami z projektu (kobieta, mezczyzna, przyjemnosc, challenge) --
# razem daje to 12 kafelkow, czyli pelne rzedy w ukladzie 4- i 2-kolumnowym.
wybrane = %w[seks kamasutra relacje swingerskistylzycia bdsm zwiazek edukacjaseksualna poliamoria]
topics = Tag.where(name: wybrane).map do |t|
  {
    "css_class" => t.name.length > 12 ? "topic-card topic-long" : "topic-card",
    "slug" => t.name,
    "label" => t.name,
    "description" => t.short_summary.presence || OPISY[t.name] || "Rozmowy o #{t.name}.",
    "faded" => false
  }
end.sort_by { |t| wybrane.index(t["slug"]) }

# Cztery wyblakle zajawki domykaja siatke do trzech rzedow, tak jak w projekcie.
# Zajawki domykaja siatke do pelnych rzedow, ale nie moga powtarzac tagow, ktore
# juz sa wyzej jako klikalne -- ten sam hashtag dwa razy wyglada jak blad.
# Zajawki nie sa linkami, wiec nie maja sluga -- porownujemy po widocznej etykiecie.
uzyte = topics.map { |t| t["label"].to_s.downcase }
zajawki = JSON.parse(Rails.root.join("config/landing_data.json").read)["topics"]
  .select { |t| t["faded"] }
  .reject { |t| uzyte.include?(t["label"].to_s.downcase) }

page = Page.find_or_initialize_by(slug: "landing-data")
page.assign_attributes(
  title: "Dane strony startowej",
  description: "Posty, profile i tematy pokazywane na stronie startowej dla niezalogowanych.",
  template: "json",
  body_json: { "posts" => posts, "profiles" => profiles, "topics" => topics + zajawki }
)
page.save!

puts "### zapisano page id=#{page.id} slug=#{page.slug}"
puts "### postow=#{posts.size} (z okladka: #{posts.count { |p| p['image'].to_s.include?('/') }})"
puts "### profili=#{profiles.size} -> #{profiles.map { |p| p['handle'] }.join(', ')}"
puts "### tematow=#{topics.size} klikalnych + #{zajawki.size} zajawek"
puts "### brakujace tagi: #{(wybrane - topics.map { |t| t['slug'] }).join(', ')}"

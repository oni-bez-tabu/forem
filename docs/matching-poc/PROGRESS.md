# Matching POC — Postęp

> Stan modułu Meetups + Matching na nietabu (Forem). Plik aktualizowany po
> każdym ukończonym etapie ze [SPEC.md](./SPEC.md) §11, służy jako brief
> dla nowego wątku Claude Code: gdzie jesteśmy, co działa, co dalej.
>
> Hierarchia źródeł prawdy: SPEC.md (funkcjonalna) → mockups/hifi (wizualna)
> → repo (konwencje techniczne).

---

## Etap 0 — Cities słownik

- **Status:** ✅ done
- **Commit:** `6b3f31881`
- **Data:** 2026-05-26

### Zaimplementowane
- Migracja `cities` (`name`, `slug`, `name_normalized`, `voivodeship`, `is_special`, `population_hint`) + indeksy na `slug` (unique), `name_normalized`, `is_special`
- Model `City` z auto-slugiem i `name_normalized` (transliteracja + strip non-alfanumerics)
- Scope `City.search_by_name` — ILIKE prefix match, sort `population_hint DESC NULLS LAST, name ASC`
- Endpoint `GET /cities/search?q=` — publiczny JSON, limit 10, w `safe_params_list.vcl` (q już dozwolone)
- Service `Meetups::CitiesSeeder` — Geonames PL pobierane runtime, idempotentny `upsert(unique_by: :slug)`
- Mapa `VOIVODESHIP_MAP` dla wszystkich 16 województw (PL.72..PL.87 — prawdziwe kody z `admin1CodesASCII.txt`)
- `NAME_OVERRIDES` (na razie tylko `"Warsaw" => "Warszawa"`)
- Rake task `cities:seed` (akceptuje `FILE=/path/to/PL.txt` do offline reseed)
- Specs: model (10), request (7), seeder (6) — łącznie **26/26 ✓**
- Smoke: 750 polskich miast (pop ≥ 5000) + rekord specjalny `🌍 Wszędzie`/`everywhere` w bazie

### Uwagi / odstępstwa / długi techniczne
- **Normalizacja diakrytyków:** sam `ActiveSupport::Inflector.transliterate` nie radzi sobie z emoji (zostawia `?`) ani interpunkcją. Trzeba było dorzucić `gsub(/[^a-z0-9 ]+/, " ").squish`.
- **Geonames trzyma EN dla Warszawy** ("Warsaw" w kolumnie name). Stąd `NAME_OVERRIDES`. Jeśli pojawią się inne kolizje (np. dla mniejszych miast) — dopisać do tej stałej.
- **Geonames admin1_code dla Polski to PL.72..PL.87**, nie wartości typu "23/28/29" jak początkowo zgadnięte. Mapa była fixowana po smoke teście. Źródło prawdy: <https://download.geonames.org/export/dump/admin1CodesASCII.txt>.
- **Endpoint bez `authenticate_user!`** — dane referencyjne publiczne, brak danych prywatnych. Do rozważenia przy hardeningu pod produkcję (rate-limit + ewentualnie auth).
- **Brak Pundit policy** — endpoint stateless read-only.
- **Brak i18n locale plików** w tym etapie — endpoint zwraca tylko dane (nazwy miast są surowymi stringami z bazy). Locale dojdą w Etapie 2 przy onboardingu UI.
- **`Zip::File.open_buffer { ... }`** zwraca obiekt zip, nie wartość bloku. Pułapka udokumentowana w kodzie przez `payload = nil` przed blokiem.
- **Seed wymaga internetu** (HTTPS do download.geonames.org). Dla offline: `dip rails cities:seed FILE=/path/to/PL.txt` po ręcznym rozpakowaniu PL.zip.

---

## Etap 1 — Meetups fundament + admin

- **Status:** ✅ done
- **Commit:** `3856fd8f0`
- **Data:** 2026-05-26

### Zaimplementowane
- Migracje `meetups` (+ `going_count`/`interested_count`) i `meetup_rsvps` z indeksami i FK
- Model `Meetup`: walidacje (XOR organizer user/org, XOR description internal post/external URL, `end_at > start_at`, slug format), auto-slug `{parameterize(name)}-{start_at.iso8601}`, scopes `published`/`visible_in_lists` (24h grace)/`upcoming_first`, helpery `organizer` i `expired_for_lists?`, `to_param = slug`
- Model `MeetupRsvp`: status enum `going`/`interested`, unique (meetup_id, user_id), counter_culture z proc dla `going_count`/`interested_count` (auto-przenoszenie przy zmianie statusu)
- Uploader `MeetupBannerUploader` (Carrierwave, secure_token filename, store w `uploads/meetups/banners/<id>/`)
- Helper `MeetupsHelper` z paletą gradient'ów dusk/velvet/ember/night/olive/sunrise (placeholder palette — do podmiany na wartości z hifi)
- Public controllery: `MeetupsController#index|show` z lifecycle filter (404 dla wygasłych/draftów) i `Meetups::RsvpsController` (POST = upsert + toggle off przy tym samym statusie, DELETE = explicit cancel)
- Admin: `Admin::MeetupsController` z scope filterami (`upcoming`/`past`/`unpublished`/`all`), `created_by` ustawiane automatycznie z `current_user`, slug lookup po `find_by!(slug: params[:id])` (URL = slug, nie integer id)
- Routes: `resources :meetups, only: %i[index show], param: :slug` + zagnieżdżony `resource :rsvp` (public), `resources :meetups` (admin)
- Views (erb + Crayons): `meetups/index` (agenda view z day headers + cards), `meetups/show` (hero + meta + RSVP section + share section z copy-link inline JS), `admin/meetups/{index,new,edit,_form}` (scope nav, tabela, formularz z file upload i radio dla description type)
- Locale files: `meetups.pl.yml` (canonical), `meetups.en.yml`, `meetups.fr.yml`, `meetups.pt.yml` (kompletne tłumaczenia)
- Specs: model Meetup (16), model MeetupRsvp (7), index/show request (8), RSVPs request (7), admin request (10) — łącznie **48/48 ✓**, pełny suite z Etapem 0 to **74/74 ✓**

### Uwagi / odstępstwa / długi techniczne
- **`to_param` zwraca slug również dla admin URL** — admin controller robi `find_by!(slug: params[:id])` zamiast `find(params[:id])`. Konsekwencja: nie można dolinkować do admin po integer ID, tylko po slug. Konwencja czytelnych URLi.
- **Walidacja organizera używa `organizer_user.present?` zamiast `organizer_user_id.present?`** — bo factory_bot buduje user'a niesave'owanego (FK nie ustawione, ale association jest), inaczej `build(:meetup)` rzucał błąd walidacji. Obie ścieżki działają w produkcji (zapisany user ma id).
- **Forem redirektuje guesta do `/magic_links/new`, nie `/users/sign_in`** — request spec dla unauthenticated POST sprawdza tylko `:redirect` bez asercji na konkretną ścieżkę.
- **Gradient banner palette to placeholder** (`MeetupsHelper::BANNER_GRADIENTS`). Wartości HEX zostały dobrane "od oka" i czekają na hi-fi tokeny z mockupów (do podmiany w Etapie 2 lub przy polishingu).
- **Form admina przyjmuje organizer user/org po integer ID** (number_field) zamiast autocomplete'ów. Świadome uproszczenie POC — autocomplete dla users/orgs zostaje na backlog.
- **Description internal post id** też wpisywany jako integer (number_field). Picker artykułów na backlog.
- **Brak preview wygasłego widgetu posta** — to logika z Etapu 4 (liquid tag).
- **`meetups.share` używa inline `<script>`** w widoku — działa, ale w produkcji warto przenieść do importowanego packa Preact razem z resztą interakcji POC.
- **i18n FR/PT zostały przetłumaczone "machinalnie"** (zgodnie z AGENTS.md wymóg "update all locales"). Native review w obu językach to debt.
- **counter_culture z proc dla column_name + column_names map** — pattern działa, ale `column_names` wymaga jawnej listy warunków `["status = ?", "going"] => "going_count"`. Jeśli kiedyś dodajemy nowy status, trzeba zaktualizować mapę.

### Acceptance check (SPEC.md §11)
- ✅ Admin dodaje meetup (request spec `POST /admin/meetups`)
- ✅ User RSVP'uje (request spec `POST /meetups/:slug/rsvp` z counter cache)
- ✅ Kopiowanie linku działa (button + JS w `_share_section.html.erb`)
- ✅ Po 24h od `end_at` meetup znika z list (scope `visible_in_lists` + request spec hides expired)

---

## Następny etap

**Etap 2 — Matching profile + integracja chrome** (SPEC.md §11)

Zakres:
- Migracja `matching_profiles` (user_id unique, photo_url, identity_type enum, city_id, bio, is_active, moderation_state pending/approved/rejected per ustaleń sesji #1)
- Ban check przy tworzeniu (rolify `:suspended`) + hook auto-dezaktywacji profilu
- API CRUD profilu + upload zdjęcia (`MatchingProfilePhotoUploader`)
- Moderacja przez admina: lista profili pending + akcje approve/reject + email do usera (mailer w 4 locales)
- Frontend: E5→E6→E7 (onboarding 4-step) + E8 uproszczona (header profilu)
- Integracja chrome nietabu: ikona ✨ w nav, karta Matching w avatar dropdown, zakładka "✨ Matching" w `/settings`
- Acceptance: user zakłada profil → admin moderuje → ban auto-dezaktywuje istniejący profil i blokuje tworzenie nowego

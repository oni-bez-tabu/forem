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

## Etap 2 — Matching profile + integracja chrome

- **Status:** ✅ done
- **Commit:** `608d91bc9`
- **Data:** 2026-05-26

### Zaimplementowane
- Migracja `matching_profiles` (user_id unique, photo Carrierwave, identity_type enum woman/man/couple/non_binary, city_id FK, bio max 200, is_active, moderation_state pending/approved/rejected, moderation_reason)
- Model `MatchingProfile`: walidacje, scopes `active`/`approved`/`pending_review`/`rejected`/`visible_to_others`, methods `approve!`/`reject!(reason:)`/`deactivate!`/`reactivate!`, callback `reset_moderation_on_content_change` (każda zmiana zdjęcia/identity/city/bio cofa zatwierdzony/odrzucony profil do pending), after_commit auto-emaila
- Uploader `MatchingProfilePhotoUploader` (Carrierwave, fallback path `pending` dla nowych rekordów)
- Worker `Matching::DeactivateProfileOnBanWorker` (Sidekiq `lock: :until_executing, on_conflict: :replace`) sprawdzający `user.suspended?` przed dezaktywacją
- Hook w `User#update_user_roles_cache` — jedna linijka `Matching::DeactivateProfileOnBanWorker.perform_async(id) if role.name == "suspended"`, podpięta do istniejącego rolify `after_add`
- Controllery:
  - `MatchingController#show` (dashboard E8 uproszczony: brak profilu / pending / approved+aktywny / dezaktywowany — z odpowiednim CTA)
  - `Matching::ProfilesController` (new/create/edit/update; blokada dla suspended; każdy edit content fields auto-resetuje moderację do pending)
  - `Admin::MatchingProfilesController` z scopami pending/approved/rejected/inactive/all i akcjami approve/reject/deactivate/reactivate/destroy
- Routes: public `/matching`, `/matching/onboarding`, `/matching/profile` (POST/PATCH/PUT), `/matching/profile/edit`; admin `resources :matching_profiles, only: %i[index destroy]` z member POST routes
- Views (Crayons + admin layout style): dashboard z moderation badge i statusem dezaktywacji, onboarding card, edit z notice o resecie moderacji, shared `_form` z autocomplete'em miast po populacji + flagą "🌍 Wszędzie" na wierzchu, admin tabela z thumbnail + akcjami inline kontekstowymi (Zatwierdź/Odrzuć dla pending, Dezaktywuj/Reaktywuj dla approved, Usuń zawsze)
- Mailer `MatchingMailer` z 2 akcjami (`approved`, `rejected`) i template'ami HTML+text w 4 locales — wysyłany przez `deliver_later` z `after_commit` modelu gdy `saved_change_to_moderation_state?`
- Chrome integracja:
  - `app/views/layouts/_top_bar.html.erb` — ✨ ikona obok dzwonka notyfikacji (signed-in only)
  - `app/views/layouts/_nav_menu.html.erb` — link "✨ Matching" w avatar dropdown
  - `Constants::Settings::TAB_LIST` + `app/views/users/_matching.html.erb` — zakładka w `/settings/matching` (link do panelu Matching)
  - `app/models/admin_menu.rb` — pozycja "matching profiles" pod Content Manager
  - `app/assets/images/twemoji/matching.svg` — placeholder ikonka tab settings (kopia fire.svg)
- Locale files: `matching.{pl,en,fr,pt}.yml` z kluczami `matching.*`, `admin.matching_profiles.*`, `matching_mailer.*` plus `views.settings.tab.Matching` (PL kanoniczne)
- Specs: model (15), request matching show (3), request profiles (6), request admin (7), worker (4) — łącznie **35/35 ✓** w Etapie 2; pełny suite Matching POC **111/111 ✓**

### Uwagi / odstępstwa / długi techniczne
- **Modyfikacja `User#update_user_roles_cache`** — dodana jedna linijka do istniejącej metody Forem zamiast tworzenia osobnego callbacka. Rolify nie wspiera array of callbacks na jednym `after_add`. Minimalna ingerencja, ale dotknęliśmy cudzego kodu — warto śledzić przy upstream merge'ach.
- **Twemoji ikonka `matching.svg` to placeholder** (kopia `fire.svg`). Do podmiany na właściwą sparkles SVG przy polishingu. Jeśli zostawimy fire — wizualnie sugeruje co innego niż ✨ używane w nav. Dług wizualny.
- **Onboarding to single-page form** zamiast multi-step E5→E6→E7 z mockupów. POC simplification — multi-step UX do dorobienia w polishingu Etapu 5/6.
- **City picker w formie to `collection_select` z wszystkimi 750 miastami** posortowane (is_special DESC, population_hint DESC). Brak autocomplete'a via `/cities/search` (POC simplification — autocomplete to dług na polish, endpoint czeka gotowy).
- **Tab "Matching" w settings to tylko link do `/matching`**, nie inline form z preferencjami. Push notification toggles (SPEC.md §7.2) dojdą w Etapie 5 razem z notyfikacjami.
- **Brak Pundit policy dla MatchingProfile** — autoryzacja w controllerze (`block_suspended_users`, `redirect_if_profile_exists`). Pundit można dorobić jeśli będą bardziej skomplikowane reguły dostępu.
- **Mailer side-effect na `after_commit` modelu** — z `if: :saved_change_to_moderation_state?`. Powoduje że `approve!`/`reject!` mailują automatycznie. Trade-off: testowalne, ale każda przyszła zmiana stanu z innego miejsca też wyśle email. Można potem wyciągnąć do explicit service objectu.
- **FR/PT tłumaczenia "machinalne"**, ten sam dług co w Etapie 1.
- **`has_role?` jest private w Forem rolify**. Wszystkie sprawdzenia idą przez `user.suspended?` (delegate na `Authorizer`). Pułapka warta zapamiętania.

### Acceptance check (SPEC.md §11)
- ✅ User zakłada profil (`POST /matching/profile` → moderation_state=pending)
- ✅ Admin moderuje (`POST /admin/.../matching_profiles/:id/approve|reject` z opcjonalnym reason)
- ✅ Email do usera po approve/reject (`MatchingMailer.approved|rejected.deliver_later`)
- ✅ Ban auto-dezaktywuje profil (hook + worker)
- ✅ Zbanowany user nie może utworzyć profilu (`block_suspended_users` w controllerze)
- ✅ Chrome: ikona ✨ w nav, link w dropdown, tab w settings

---

## Następny etap

**Etap 3 — Deklaracje + visibility + lista matchów inline + event-scoped profil** (SPEC.md §11)

Zakres:
- Migracja `meetup_matching_declarations` (meetup_id, matching_profile_id, intent_level enum, looking_for jsonb, meetup_note)
- API CRUD deklaracji + endpoint listy matchów z regułami R1–R8 (visibility, grupowanie, just_vibe asymetria, not_looking lockout)
- Endpoint `GET /m/:meetup_slug/:profile_id` — event-scoped profil z lifecycle 48h (SPEC.md §R-Lifecycle.2), 404 po expiry
- Frontend: E10 popup deklaracji (3 sekcje: intent, looking_for, meetup_note), E3/E4 inline lista matchów (2 grupy ✦ ta sama intencja / inni), E15 event-scoped profil, F' partial blurred dla Interested-without-declaration
- Popup-based RSVP flow z deklaracją dla obu statusów (going + interested)
- Acceptance: P2 klika RSVP → popup intencji → zapis → lista; P3 widzi grupy; profil matcha pokazuje meetup_note z konkretnego meetupu

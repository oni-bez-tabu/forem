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

## Etap 3 — Deklaracje + visibility + lista matchów inline + event-scoped profil

- **Status:** ✅ done
- **Commit:** `15c10ca5d` (kod) + `c6fe856ac` (demo seed) + `6ba3df00d`/`77fecbcca` (polish: drop identity filter + drop column)
- **Data:** 2026-05-26

### Zaimplementowane
- Migracja `meetup_matching_declarations` (meetup_id FK, matching_profile_id FK, intent_level, looking_for jsonb array, meetup_note) z unique index (meetup_id, matching_profile_id) i index na (meetup_id, intent_level)
- Model `MeetupMatchingDeclaration`: walidacje (intent inclusion, looking_for subset of identities, RSVP-required na tym samym meetupie), scopes `active_intents`/`for_meetup`, methods `intent_active?`/`not_looking?`/`effective_looking_for` (R3 just_vibe wildcard)
- Relacje: `Meetup has_many :matching_declarations`, `MatchingProfile has_many :matching_declarations` (oba `dependent: :destroy`)
- Worker `DeactivateProfileOnBanWorker` rozszerzony — po banie kasuje wszystkie deklaracje usera (Q6: "intencje i deklaracje znikają, welcomes zostają")
- Service `Matching::PoolFinder(viewer_profile:, meetup:)` implementuje R1–R6:
  - `viewer_visible?` — R4 lockout dla not_looking i braku aktywnego profilu/deklaracji
  - `compatible_declarations` — bidirectional filter A.identity ∈ B.looking_for AND B.identity ∈ A.looking_for (R1), z R3 just_vibe wildcard
  - `same_intent_group` / `other_intent_group` — R2/R5 grupowanie
  - Wyklucza moderowane `pending`/`rejected` i nieaktywne profile
- Controllers:
  - `Matching::DeclarationsController` (new/create/edit/update/destroy) z gardami: zalogowany + aktywny profil + RSVP na meetupie
  - `Matching::EventScopedProfilesController#show` z 48h lifecycle (404 po `end_at + 48h`, 404 dla not_looking, 404 dla nieaktywnego profilu)
- Routes:
  - `resource :declaration` zagnieżdżony pod `resources :meetups` (URL: `/meetups/:slug/declaration/new|edit`, POST/PATCH/DELETE `/meetups/:slug/declaration`)
  - `get "/m/:meetup_slug/:profile_id"` z constraint `profile_id: /\d+/` (event-scoped profile)
- Update `Meetups::RsvpsController#create` — Flow C.2: po zapisie RSVP, jeśli user ma aktywny profil ale brak deklaracji na tym meetupie → redirect na `new_meetup_declaration_path` z dedykowanym notice
- Views:
  - `matching/declarations/form` (3 sekcje: intent radio, looking_for checkboxes, meetup_note textarea) — single-page form zamiast modal popupa (POC simplification)
  - `matching/event_scoped_profiles/show` (E15: hero, identity/city/intent pills, bio, meetup_note z kontekstu, placeholder dla welcome message — Etap 4)
  - `meetups/_matching_section` w hub: 5 stanów (brak profilu / niewidoczny / brak RSVP / brak deklaracji + opcjonalnie blurred teaser / not_looking explanation / pełna lista matchów)
  - `matching/_matches_list` (2 grupy ✦ pasują do intencji / inni którzy się zadeklarowali) + `_match_card` z thumbnail, intent label, identity pill, city pill, bio teaser, meetup_note teaser, klik → event-scoped profil
  - `matching/_matches_blurred_teaser` (F': blurred placeholder dla Interested z profilem ale bez deklaracji)
- Locale files `declarations.{pl,en,fr,pt}.yml` z kluczami `matching.section.*`, `matching.declarations.*`, `matching.matches.*`, `matching.event_scoped.*` plus `meetups.rsvp.prompt_for_declaration`
- Specs: model `MeetupMatchingDeclaration` (10), service `PoolFinder` (8), request `Matching::Declarations` (7), request `EventScopedProfiles` (5), update worker spec (1 nowy) — łącznie **36/36 ✓** w Etapie 3; pełny suite Matching POC **147/147 ✓**

### Uwagi / odstępstwa / długi techniczne
- **🔴 Filter po identity wyłączony (decyzja sesji #2, 2026-05-26).** SPEC.md §6 R1 mówił o bidirectional `looking_for` filter; po decyzji produktowej "zawsze zestawiamy wszystkie płcie" `PoolFinder#compatible_with_viewer?` zawsze zwraca `true`, kolumna `looking_for` zdropowana z DB i z migracji `20260526210000`. Forma deklaracji ma teraz tylko 2 sekcje (intent + notatka). Jeśli kiedyś wracamy do filtrowania per identity — przywróć migrację `t.jsonb :looking_for`, walidację w modelu, sekcję w formie i bidirectional check w `PoolFinder`. Wszystkie pozostałe reguły (R2 grupowanie, R3 just_vibe, R4 not_looking lockout, R5 grupowanie) działają bez zmian.
- **E10 popup zaimplementowany jako oddzielna strona** (`/meetups/:slug/declaration/new`), nie modal w meetup hub. Powód: w POC redirect-after-action jest prostszy niż modal z Preact + form. Modal można dodać przy polishingu — flow logiczny (RSVP → declaration → hub) jest identyczny.
- **Welcome message button w E15 jest zdisabled placeholder** (`title="Welcome coming soon"`). To Etap 4 — endpoint i Cloud Function jeszcze nie istnieją. Klik nic nie robi.
- **Brak debounce dla deklaracji "live"** — każdy zapis to round-trip. To OK dla POC, ale dla UX warto rozważyć inline editing w Etapie 5/6.
- **Brak warunkowego ukrywania pól per intent** — SPEC.md §5 Flow E mówi że `meetup_note` ukrywa się dla `not_looking`. POC: pole zawsze widoczne, ale model zachowuje wartość niezależnie. Polish UX dług.
- **`pool_finder` nie ma sortowania per relevance** — kolejność zależy od kolejności `MeetupMatchingDeclaration.order(:id)` (domyślna). Sorting per "recently active" / "compatibility score" — backlog.
- **Constraint na route `profile_id: /\d+/`** — wymusza integer FK. To OK bo MatchingProfile używa Rails default integer id. Jeśli kiedyś migrujemy na UUID, ta linia musi pójść w odstawkę.
- **R7/R8 (welcome lockout, pary) nie zaimplementowane** — R7 to Etap 4 (welcome), R8 (couple jako jedno konto) na razie obsługiwane jako standardowy identity_type bez specjalnej logiki.
- **Demo data:** `dip rails matching:seed_demo_data` (idempotentny) tworzy 18 demo userów (hasło `password`), 18 profili (16 approved + 1 pending + 1 rejected), 25 RSVPs, 24 deklaracji rozłożonych na 2 demo meetupy.
- **Stale dev containers** — po długiej sesji (~12h) Docker container `forem-web-run-*` trzymał template cache mimo dev autoreload. Przy podobnych objawach: `docker rm -f forem-web-run-*` + `dip rails s` ponownie. Sprawdzone 2 razy podczas Etapu 2 i 3.

### Acceptance check (SPEC.md §11)
- ✅ P2 klika RSVP → popup intencji → zapis → lista (Flow C.2 + `Meetups::RsvpsController#needs_declaration_prompt?` + `matching/declarations#new`)
- ✅ P3 widzi grupy (`PoolFinder#same_intent_group` + `other_intent_group` rendered w `_matches_list`)
- ✅ Profil matcha pokazuje meetup_note z konkretnego meetupu (`event_scoped_profiles#show` ładuje declaration na pair (meetup, profile))
- ✅ 404 po 48h od `end_at` (`EVENT_SCOPED_LIFETIME` check)
- ✅ Worker after-ban kasuje deklaracje (Q6)

---

## Etap 4 — Welcome + Boost + Widget meetupu

- **Status:** ✅ done
- **Commit:** `fd74df313`
- **Data:** 2026-05-27

### Zaimplementowane

**Welcome:**
- Migracja `matching_welcomes` (sender_profile_id FK, receiver_profile_id FK, meetup_id FK, sent_at) z unique index na (sender_profile_id, receiver_profile_id) → "raz na osobę nigdy więcej" niezależnie od meetupu
- Model `MatchingWelcome` z walidacjami (unique pair, brak self-welcome), helperami `exists_between?(a, b)` i `render_body(sender_profile:, meetup:, host:)`, stałą `TEMPLATE` z treścią uniwersalną
- Relacje: `MatchingProfile has_many :welcomes_sent / :welcomes_received` (dependent: :destroy), `Meetup has_many :matching_welcomes`
- Service-seam `Matching::DeliverWelcomeViaCloudFunction.call(welcome:, body:)` — POSTuje JSON do `ApplicationConfig["MATCHING_WELCOME_CLOUD_FUNCTION_URL"]`, gdy URL nieustawiony → log warn + return `{status: :stubbed}` (POC; CF dorobi się osobno poza Forem repo)
- Controller `Matching::WelcomesController#create` (POST /matching/welcomes) z walidacjami: zalogowany + active+approved sender, lifecycle 48h, distinct receiver, visible receiver, obie deklaracje aktywne (intent != not_looking, R4), unique pair → 409
- View `app/views/matching/event_scoped_profiles/_welcome_modal.html.erb` — E18 modal 3-state (compose → sending → success + state error), inline vanilla JS z `fetch` do POST /matching/welcomes, niedytowalny preview treści, sekcja "co się stanie", warning "raz na osobę"
- `EventScopedProfilesController#show` rozszerzony o `@viewer_profile`, `@welcome_already_sent`, `@welcome_eligible` — widok renderuje 3 stany buttona (eligible / already_sent / not_eligible)

**Liquid tag meetupu:**
- `app/liquid_tags/meetup_tag.rb` (dziedziczy z `LiquidTagBase`, parsuje slug, raise `StandardError` z i18n na nieznany/invalid)
- Partial `app/views/meetups/_liquid.html.erb` — 3 stany renderowania: `:upcoming` (start_at > now), `:active` (między start_at a end_at + 24h), `:expired` (po end_at + 24h, R-Lifecycle.1). Author RSVP status (going/interested) pokazany inline gdy widget renderuje się w poście autora
- Rejestracja `Liquid::Template.register_tag("meetup", MeetupTag)` na końcu pliku
- i18n: `liquid_tags.meetup_tag.{invalid_slug,not_found}` + `meetups.widget.state.{upcoming,active,expired}`, `meetups.widget.author_rsvp.{going,interested}`, `meetups.widget.cta` (4 locales)

**Boost:**
- Controller `Meetups::BoostsController#create` (POST /meetups/:slug/boost) woła `Articles::Creator.call` z `type_of: "full_post"`, `body_markdown: "#{user_text}\n\n{% meetup #{slug} %}"`, tytuł derive'owany z pierwszej linii body (truncate do 120 znaków, fallback = nazwa meetupu)
- View `app/views/meetups/_boost_modal.html.erb` — modal w meetup hub: textarea bez prefill (placeholder "Napisz coś o tym wydarzeniu..."), preview widgetu pod polem (render partial `meetups/_liquid` z stanem `:upcoming`), Opublikuj/Anuluj. Inline vanilla JS: fetch POST → redirect do `article.path`
- Update `_share_section.html.erb`: button "Udostępnij na nietabu" (tylko signed-in) otwiera boost modal
- Lifecycle: boost dla `Meetup.visible_in_lists` (24h window) — wygasłe meetupy → 404 (nie da się boostować zakończonego eventu)
- i18n: `meetups.boost.{heading,placeholder,submit,cancel,published,preview_label,sign_in_required}`, `meetups.share.share_to_nietabu` (4 locales)

**Testy:**
- Model `MatchingWelcome` (11): validations, exists_between?, render_body, cascade destroys
- Service `DeliverWelcomeViaCloudFunction` (4): stub gdy brak URL, sukces 2xx, błąd non-2xx, exception handling
- Request `Matching::Welcomes` (12): create + delivery, body template, dup 409, dup across meetups 409, lifecycle 404, brak deklaracji 422, not_looking 422 (sender i receiver), receiver inactive 404, sender inactive 403, self-welcome 422, unauthenticated redirect
- Request `Matching::EventScopedProfiles` (9): pełne pokrycie + 4 nowe stany welcome modala (eligible button widoczny / already_sent / not_eligible / not_eligible przy inactive viewer profile)
- Liquid tag `MeetupTag` (6): render name + link, 3 stany (upcoming/active/expired), nieznany slug raise, invalid slug syntax raise
- Request `Meetups::Boosts` (5): create full_post + widget tag, empty body 422, unknown meetup 404, expired meetup 404, unauthenticated 401

Pełny Matching POC suite: **185/185 ✓** (74 Etap 0–1, +37 Etap 2, +36 Etap 3, +38 Etap 4)

### Uwagi / odstępstwa / długi techniczne

- **🔴 Chat nietabu to Firebase, nie Rails.** Najważniejsze znalezisko researchu: w obecnym kodzie nie ma już modeli `Message`/`ChatChannel` — chat siedzi w Firestore. Rails tylko generuje token Firebase dla klienta i odbiera webhooki "ktoś wysłał wiadomość". W konsekwencji `POST /matching/welcomes` tworzy tylko rekord w `matching_welcomes` i woła `DeliverWelcomeViaCloudFunction`, który (a) wysyła JSON do CF jeśli `MATCHING_WELCOME_CLOUD_FUNCTION_URL` jest ustawione, (b) loguje warning i zwraca `:stubbed` jeśli env nieustawione. **Cloud Function (poza Forem repo) jest TODO osobnego sprintu** — w POC welcome rekord powstaje, ale wiadomość do Firestore nie trafi dopóki CF nie jest deployowana. PROGRESS Etap 3 już to anonsował ("endpoint i Cloud Function jeszcze nie istnieją"); endpoint mamy, CF zostaje.
- **R1 compatibility filter pominięty w welcome (decyzja sesji #2 z Etapu 3).** SPEC.md §7.3 mówił o walidacji R1 (bidirectional identity check). Skoro `looking_for` zostało zdropowane z deklaracji w Etapie 3, welcome ma teraz tylko: unique pair + obie deklaracje aktywne (intent != not_looking, R4) + lifecycle 48h + visible receiver. Jeśli kiedyś wracamy do filtra identity → przywróć `looking_for` w Etapie 3 (patrz PROGRESS Etap 3) i dodaj bidirectional check w `require_both_declarations_active`.
- **Boost używa `type_of: "full_post"`, nie "status".** Pierwotnie celowałem w status type (Forem ma nawet `self.title = "[Boost]" if title.blank? && type_of == "status"`), ale status wymusza `body_markdown` puste lub tylko embed tag z URL w tytule. Liquid tag `{% meetup ... %}` w body nie pasuje. Wybór: full_post z tytułem derive'owanym z pierwszej linii body (truncate 120 znaków). SPEC §8.5 mówi "zwykły post nietabu z treścią + osadzonym widgetem" — full_post pasuje semantycznie.
- **Boost modal nie wstawia widgetu w sam tekst** — widget jest osadzany automatycznie pod treścią (zachowanie zgodne z SPEC §8.5 "widget jest jedynym automatycznym elementem"). User nie widzi `{% meetup ... %}` syntaxu, tylko preview wyrenderowany.
- **E18 modal to vanilla JS w ERB**, jak boost modal i share section z Etapu 1. Spójność konwencji POC, ale w produkcji warto wszystkie 3 popupy przenieść do Preact packa (np. `matchingPopups`). Polish dług.
- **Welcome template hardcoded w Ruby** (`MatchingWelcome::TEMPLATE`), nie i18n. Powód: SPEC.md §7.4 podaje konkretną treść po polsku i mówi "treść uniwersalna" (kobieta/mężczyzna/para/non_binary) — jedna treść dla wszystkich. Jeśli kiedyś wielojęzyczność CF nadawcy → przenieść do `config/locales`.
- **`Matching::WelcomesController` używa `EventScopedProfilesController::EVENT_SCOPED_LIFETIME`** jako źródła prawdy dla okna 48h. Dwa miejsca odwołują się do tej samej stałej — jeśli kiedyś zmieniamy lifecycle, zmieniamy w jednym miejscu.
- **Pre-existing tech debt naprawiony przy okazji:** spec `event_scoped_profiles_spec.rb:32` używał `update_columns(..., looking_for: [])` po zdropowaniu kolumny w Etapie 3 — test był failed, naprawione (sama kolumna intent_level wystarczy do testu R4).
- **Widget meetupu w stylu inline** — kolory i layout w `_liquid.html.erb` są wpisane jako inline styles. To celowo (POC, nie chcę dotykać assetu CSS pipeline dla niskim ryzykiem regresji). Polish dług: przenieść do crayons / tokenów.
- **Routes:** `post :boost, on: :member` używa parametru `:slug` (member action na resource z `param: :slug`), nie `:meetup_slug` jak nested resources. Kontroler obsługuje oba dla bezpieczeństwa (`params[:slug] || params[:meetup_slug]`).
- **FR/PT tłumaczenia "machinalne"**, ten sam dług co w Etapach 1–3.
- **RuboCop:** 4 minor offenses w `deliver_welcome_via_cloud_function_spec.rb` (`RSpec/MessageExpectation`, `RSpec/MessageSpies` — preferują `allow` + `have_received` zamiast `expect ... to receive`). Stylistyka, nie błąd; do akceptacji albo refaktoru przy CI failure.

### Acceptance check (SPEC.md §11 + §7.3 + §8.5)

- ✅ User wysyła welcome z linkiem do event-scoped profilu (`POST /matching/welcomes` + `MatchingWelcome.render_body` z URL `/m/{slug}/{id}`)
- ✅ Link do welcome działa do 48h po `end_at` (`EventScopedProfilesController` lifecycle 48h, weryfikowane w request spec)
- ✅ Po 48h `POST /matching/welcomes` zwraca 404 (`require_within_lifecycle` w kontrollerze)
- ✅ "Raz na osobę nigdy więcej" — unique index na (sender_profile_id, receiver_profile_id), kontroler zwraca 409 (test pokrywa duplicate w tym samym meetupie i across meetups)
- ✅ R4 lockout: not_looking nie może wysłać ani otrzymać welcome (422)
- ✅ Widget meetupu w 3 stanach: upcoming / active / expired po 24h (R-Lifecycle.1)
- ✅ Klik widgetu w stanie expired → standardowy 404 (link prowadzi do `meetup_path(meetup)` = `/meetups/{slug}`, hub serwuje 404 dla expired)
- ✅ Boost flow: pusty textarea, widget meetupu osadzony pod polem (preview + `{% embed <url> %}` tag w body, routuje do MeetupTag przez UnifiedEmbed), bez prefilla
- ✅ Boost tworzy zwykły post nietabu (`Article` type_of full_post, tytuł derive'owany z 1. linii), redirect do `article.path`
- ✅ `{% embed https://host/meetups/<slug> %}` (canonical Forem pattern) routuje do MeetupTag — zarejestrowane w UnifiedEmbed::Registry z `skip_validation: true` i pozycją FRONT (unshift) żeby wygrać priorytetem z catch-all ForemTag
- ⚠️ **Dostarczenie welcome do chatu Firebase: stubbed w POC** — service tworzy rekord i woła CF, ale sama CF nie jest jeszcze deployowana. Wymaga osobnego sprintu na Firebase side. Endpoint Rails gotowy.

### Etap 4 — Polish po sesji (commit `e3f727d52`)

Post-review fixes po pierwszym wglądzie w wyrenderowany widget:
- **Layout widgetu z mockupu E1** — 3-kolumnowy grid (data 72px / tytuł+venue+org fluid / banner 144×81 16:9). Wcześniej był banner 140px na górze a poniżej cała reszta (rozjeżdżało się przy długich tytułach + thumbnail 96×96 ucinał 16:9 do kwadratu).
- **Banner jako `<img>` (nie `<div background-image>`)** — Redcarpet auto-zamykał `<a>` przed `<div>` w body markdownu (HTML4 reguła "no block in a"), thumbnail wypadał poza link. `<img>` jest inline → bezpiecznie w `<a>`.
- **Wszystkie kontenery tekstu na `<span style="display: block">`** — z tego samego powodu (spany są inline, prawidłowe w `<a>`).
- **`<a>` opakowuje cały kafel** (100% width + cały klikalny) zamiast `<div>` z buttonem CTA "Zobacz wydarzenie →".
- **Link `meetup_path(meetup)` zamiast hardcoded `/wydarzenia/<slug>`** — SPEC §10 mówił `/wydarzenia/<slug>` ale routy są pod `/meetups/<slug>`; nie dodajemy aliasu, używamy istniejącego helpera.
- **Usunięte z widgetu:** label stanu na górze (`NADCHODZĄCE WYDARZENIE`), label "✓ Autor idzie/zainteresowany" (czytanie po stanie autora w embedzie posta to za dużo zaszumiania).
- **MeetupTag w UnifiedEmbed::Registry** — `{% embed http://host/meetups/<slug> %}` działa jak inne Forem embedy lokalnego contentu (artykuły, komentarze). Boost flow generuje teraz `{% embed <url> %}` zamiast `{% meetup <slug> %}` dla spójności.
- **Krytyczna pułapka:** ForemTag rejestruje catch-all regex `URL.url/[\w-]+?` matchujący każdy lokalny URL i siedział pierwszy w `@registry` array. `detect` wybierał ForemTag zanim doszło do MeetupTag → próbował HEAD walidować `localhost` → `private_ip?` blokował → "invalid_url" error. Fix: `unshift` MeetupTag NA POCZĄTEK array (nie `append`), plus dedupe po `klass.name == "MeetupTag"` (nie po `== klass`) żeby przeżyć Zeitwerk autoreload.
- **`skip_validation: true`** dla MeetupTag w UnifiedEmbed — lokalne URL'e nie potrzebują HEAD round-trip, MeetupTag robi własny `Meetup.find_by(slug:)` lookup i raise jeśli brak.
- **Boost używa `type_of: "full_post"`** (nie `"status"`) — status type wymusza puste `body_markdown` (treść idzie w tytule + auto-embed z URL'a w tytule). To nie pasuje do liquid tagu `{% embed %}` w body. Full_post pasuje semantycznie do SPEC §8.5 ("zwykły post nietabu z treścią + osadzonym widgetem"). Tytuł derive'owany z 1. linii body (truncate 120).

---

## Etap 5 — Timeline E8 + powiadomienia

- **Status:** ✅ done
- **Commit:** `3a13eeb46`
- **Data:** 2026-05-27

### Zaimplementowane

**Toggles powiadomień (Forem `users_notification_settings`):**
- Migracja `20260527150000_add_matching_notification_settings` — dodaje 2 boolean'y do FOREM core table `users_notification_settings`: `notify_on_new_matches` (DEFAULT true), `notify_on_new_city_meetups` (DEFAULT true). Inwazyjnie ingeruje w Forem core, ale to świadoma decyzja (vs osobna tabela) — Forem konwencja, jeden `notification_setting` per user
- `Users::NotificationSettingsController::ALLOWED_PARAMS` rozszerzony o oba klucze
- Controller obsługuje opcjonalny `return_to` param (whitelist po `Constants::Settings::TAB_LIST`) — formularz w matching tab odsyła z powrotem na `/settings/matching` zamiast na `:notifications` tab
- `app/views/users/_matching.html.erb` — nowa sekcja form_for `@users_notification_setting` z 2 checkbox'ami, hidden `return_to=matching`, klucz `matching.settings.notifications_*`, helper labels w 4 locales

**Push notifications — pool member trigger (Kat 1):**
- Service `Notifications::Matching::NewPoolMember::Send.call(declaration_id)` — dla nowej aktywnej deklaracji znajduje pre-existing pool members na meetupie (intent != not_looking, exclude self, exclude pending profiles), pre-filtruje po `notify_on_new_matches=true`, tworzy `Notification` rekord (insert_all, notifiable=Meetup, action=`matching_pool_member`) + `PushNotifications::Send.call` z title "Nowe dopasowanie na {meetup.name}"
- Worker `Notifications::Matching::NewPoolMemberWorker` (Sidekiq, lock: until_executing, on_conflict: replace)
- Hook `MeetupMatchingDeclaration#after_create_commit :notify_pool_of_new_member` — enkolejkowuje worker (skip dla not_looking)

**Push notifications — new city meetup trigger (Kat 2):**
- Service `Notifications::Meetups::NewCityMeetup::Send.call(meetup_id)` — dla świeżo opublikowanego meetupu (musi mieć venue_city) znajduje matching_profiles widoczne dla innych w mieście meetupu LUB z `city.is_special=true` ("🌍 Wszędzie"), pre-filtruje po `notify_on_new_city_meetups=true`, tworzy Notification + push z title "Nowe wydarzenie w {miasto}"
- Worker `Notifications::Meetups::NewCityMeetupWorker`
- Hook `Meetup#after_commit :notify_city_profiles_on_publish` — fire jednorazowo gdy `saved_change_to_is_published?` && `is_published == true` (obsługuje create-as-published i edit-toggle-on; ignoruje update bez zmiany publish state i toggle-back-off)

**Timeline (`Matching::TimelineFeed`):**
- Service agregator: dla danego user'a zbiera RSVP, declarations (created + updated jeśli touched), welcomes sent/received, match_found (z `Notification` rekordów). Lifecycle filter R-Lifecycle.1 — wpisy dla meetupów `end_at + 24h <= now` znikają. Sortuje desc, limituje (default 30)
- Każdy event: `{ type, at, meetup, payload }` — ujednolicony shape, view łatwo renderuje

**Rekomendacje (`Matching::MeetupRecommendations`):**
- Service: nadchodzące meetupy z `visible_in_lists` filtrowane po city usera (lub everywhere, lub all-cities gdy user ma special city), exclude meetupów gdzie user już RSVP'ował, sortowane po liczbie aktywnych deklaracji DESC + start_at ASC (proxy dla "tu coś się dzieje"). POC heurystyka (SPEC §12.13 zakładał pool-based wg `looking_for` — kolumna zdropowana w Etapie 3)

**Frontend E8 (`/matching` show):**
- Controller ładuje `@timeline` i `@recommendations` tylko dla `visible_to_others?` profile (limit 30 events + 3 recommendations)
- View: kompaktowy header (avatar 64px round + identity/city/badge chips + manage link); jeśli timeline lub recommendations niepuste → renderowana lista `_timeline_feed` z wstawkami `_timeline_recommendation` co 5 wpisów (tail spillover dla pozostałych jeśli timeline krótki); icon-per-type w `_timeline_event` (📅 ✨ ✏️ 💌). 4 stany profilu (no profile / pending / rejected / deactivated) z odpowiednim explanation copy
- Empty state gdy 0 events i 0 recommendations

**i18n (4 locales):**
- `matching.show.{pending_explanation,rejected_explanation}` — nowe stany
- `matching.timeline.{heading,empty_state,ago,events.{rsvp_going,rsvp_interested,declaration_created,declaration_updated,welcome_sent,welcome_received,match_found}}`
- `matching.recommendations.label`
- `matching.settings.{notifications_heading,notifications_intro,notifications_save}`
- `helpers.label.users_notification_setting.{notify_on_new_matches,notify_on_new_city_meetups}`
- `services.notifications.matching.new_pool_member.{title,body}`, `services.notifications.meetups.new_city_meetup.{title,body}`

**Testy (48 nowych w Etapie 5):**
- Service `Notifications::Matching::NewPoolMember::Send` (8): in-app + push, skip not_looking, skip self, skip notify_off, skip pending profile, no-op na not_looking declaration, no-op na unknown id
- Worker `Notifications::Matching::NewPoolMemberWorker` (3): delegacja + auto-enqueue dla active intent + skip not_looking
- Service `Notifications::Meetups::NewCityMeetup::Send` (8): notify city, notify everywhere, skip other cities, skip pending profiles, respect notify_off, push title contains city, skip unpublished, no-op na unknown
- Worker `Notifications::Meetups::NewCityMeetupWorker` (5): delegacja + enqueue on create-published + on flip-to-published + no enqueue on no-publish-change + no enqueue on flip-off
- Service `Matching::TimelineFeed` (9): RSVP, declaration_created, declaration_updated, welcome_sent, welcome_received, match_found, lifecycle filter, sort+limit, no-profile-only-RSVPs
- Service `Matching::MeetupRecommendations` (10): no profile → none, city match, everywhere bonus, exclude other cities, exclude own RSVPs, exclude started, exclude unpublished, sort by active count DESC, limit, everywhere profile sees all
- Request `/matching` (8): all states (no profile / pending / approved+active) + timeline heading + empty state + RSVP event renders + recommendation card renders

Pełny Matching POC suite: **234/234 ✓** (74 Etap 0–1, +37 Etap 2, +36 Etap 3, +39 Etap 4, +48 Etap 5)

### Uwagi / odstępstwa / długi techniczne

- **🔴 Migracja inwazyjnie modyfikuje Forem core table `users_notification_settings`.** Decyzja z sesji (user-confirmed). Konwencja Forem: jeden notification_setting per user. Konsekwencja: przy upstream rebase trzeba sprawdzić czy Forem nie dodał kolumn o tej samej nazwie. Alternatywa (osobna tabela `matching_notification_preferences`) była rozważana ale odpadła — extra join na każdy push.
- **`UnifiedEmbed::Tag.validate_link` ma `private_ip?` check który blokuje `localhost`.** Nie wpływa na Etap 5 ale do zapamiętania — uderzyło nas w Etapie 4 polishu (MeetupTag musi mieć `skip_validation: true` + `unshift` w Registry).
- **`Notifications::Matching::NewPoolMember::Send` używa `Notification.insert_all` (bulk insert)** — szybko przy dużym poolu, ale pomija ActiveRecord callbacks na Notification. Forem domyślnie nie ma callbacks na Notification model (sprawdzone), więc bezpieczne. Jeśli kiedyś Forem doda callback na create — przemyśleć powrót do `Notification.create!` w pętli.
- **`PushNotifications::Send` w dev/test może być no-op** — wymaga `consumer_app.operational?` (czyli APNs/GCM credentials). W test specs używamy `allow(PushNotifications::Send).to receive(:call)` zamiast stubować na poziomie ConsumerApp.
- **Timeline `:match_found` źródło to `Notification` rekord** — wymaga że `NewPoolMember::Send` zostało wcześniej wywołane. Jeśli user wyłączył push toggle, NOTHING w timeline. Świadome — toggle off oznacza "nie chcę wiedzieć o tych eventach". Alternatywa: ALWAYS recordować Notification, tylko push filtrować — ale to inflowałoby in-app feed dla userów którzy explicitly opt-outed.
- **Timeline `:declaration_updated` heurystyka** — emituje update event tylko gdy `updated_at - created_at > 1 second`. Inaczej każda świeża deklaracja generowała by 2 wpisy (create + immediate update z save callbacks).
- **Recommendations sortowanie** — pierwotny `left_joins + GROUP BY + ORDER COUNT()` wybuchł na ambiguous `id` w PG (interpretował jako `meetups.id`, nigdy NULL → odfiltrował meetupy bez deklaracji). Fix: subquery `MeetupMatchingDeclaration.group(:meetup_id).count` + sort w Ruby. Mniej elegancki SQL-wise ale poprawny dla małej liczby kandydatów (POC). Optymalizacja jeśli liczba meetupów per city > kilkaset.
- **R-Lifecycle.1 lifecycle filter robi `Meetup::LIST_LIFECYCLE_GRACE.ago`** w Ruby (po pobraniu eventów z DB), nie w SQL. POC simplification — przy dużych zbiorach przepiąć na SQL JOIN z `meetups` i WHERE.
- **Email notifications nie dodane** — SPEC §7 mówi tylko o push i in-app. Jeśli email by się przydał (np. weekly digest "ostatnio nowe dopasowania"), można rozbudować service.
- **FR/PT tłumaczenia "machinalne"**, ten sam dług co w Etapach 1–4.

### Acceptance check (SPEC.md §11 + §7.1 + §7.2)

- ✅ Timeline pokazuje historię (RSVP, declarations, welcome sent/received, match found)
- ✅ Push działa: 2 kategorie z toggle, ON by default, pre-filter po user'a settings przed PushNotifications::Send
- ✅ Toggles persistują (formularz POST /users/notification_settings z return_to=matching → redirect z powrotem na matching tab)
- ✅ R-Lifecycle.1 — wpisy dla wygasłych meetupów (>24h po end_at) znikają z timeline
- ✅ Recommendation inline w timeline (co 5 wpisów + tail spillover, max 3)
- ✅ Push trigger fires per spec: matching gdy nowa deklaracja active intent (after_create_commit), meetup gdy is_published flipped to true (after_commit + saved_change_to_is_published?)
- ✅ City filtering: dokładne match + "everywhere" zawsze wpadają, inne miasta odrzucone
- ⚠️ **Welcome push delivery: wciąż stub** (Etap 4 dług) — Cloud Function dorobi się osobno, push do chatu Firebase nie idzie via PushNotifications::Send (per SPEC §7.1 "welcome push pochodzi z istniejącego push systemu chatu nietabu")

---

## Etap 6 fala 1 — UI polish 1:1 z hifi mockup E8 + meetup hub hero

- **Status:** ✅ done
- **Commit:** `dcd5b00a5`
- **Data:** 2026-05-27

### Zaimplementowane

**TimelineFeed (refaktor + nowy event type):**
- `Matching::TimelineFeed.match_found_events` zmienione: agregacja PER MEETUP zamiast osobne event'y per joiner. Payload: `{ count, joiners: [top 3 MatchingProfile records] }`. Pokrywa mockup E8 "3 nowe dopasowania" wiersz z grid 3 mini-cards.
- Nowy typ event'a `:needs_intent` — fires gdy user ma RSVP ale brak deklaracji na visible meetupie (i ma aktywny profil). Mockup E8 "Czeka na intencję" magenta dashed card.

**MeetupRecommendations (refaktor z 'why'):**
- Service zwraca `Recommendation` struct: `{ meetup, active_count, identity_breakdown, open_to_meet_count }`. Pozwala renderować "Bo: X osób zadeklarowało intencję" + breakdown po identity ("7 kobiet · 4 pary") + "✨ 5 chce się poznać".

**E8 dashboard UI (`/matching`):**
- Profile header card 1:1 z mockupem: foto 96×120, h2 "Twój profil Matching" + status pill + identity/city/"X nowych dopasowań" badges, italic bio quote, mute privacy hint, manage button outline po prawej.
- Dot timeline (helper `MatchingHelper#dot_hex_for`): kolorowe kropki per typ event + linia łącząca.
- Kind label per event ("Nowe dopasowanie" / "Zadeklarowano intencję" / "Zapisano się") + czas relatywny po prawej.
- `match_found` z mini-cards grid (3 kolumny 1:1, foto + identity pill + city + bio teaser), klik → event-scoped profile. "Zobacz wszystkich (X)" gdy count > preview.
- `needs_intent` magenta dashed card z "Dodaj intencję" button → declaration form.
- Recommendation full card: banner 140px po lewej (lub gradient fallback), dashed brand border, "✨ Polecane dla ciebie" pill, "Bo: X osób zadeklarowało intencję" + breakdown italic, 2 buttony.

**Meetup hub UI (`/wydarzenia/<slug>`):**
- Hero 380px z banner cover + linear gradient overlay i biały text overlay: eyebrow "📅 Sobota · za 12 dni" (relative date z helpera `meetup_hero_eyebrow`), h1 32px, full date + godziny + venue/city.
- Meta row z avatar organizatora 44px (round) + label "Organizator" + name + duży primary button "Zobacz pełen opis →".
- RSVP section z h2 "Wybierz swój udział", caveat, large buttony, inline counts, going confirmation card.
- Divider'y między sekcjami.

**Helpers:**
- `MatchingHelper#dot_hex_for(event_type)` + `dot_color_for(event_type)` dla dot timeline.
- `MeetupsHelper#meetup_hero_eyebrow(meetup)` — relatywna data "Sobota · za 12 dni" / "jutro" / "X dni temu".

**i18n (4 locales, ~40 nowych kluczy):** `matching.show.{profile_title, matches_count, privacy_hint}`, `matching.timeline.{subheading, match_found_caption, see_all, needs_intent_caption, declare_intent_button, kind_labels.*, events.rsvp_*_pill}`, `matching.recommendations.{reason_lead, reason_pool_count, open_to_meet_count, view_meetup, declare_intent}`, `matching.identity_types_plural.*`, `meetups.show.{back_to_list, counts_caveat, going_short, interested_short, going_confirmation, going_confirmation_tail, relative.*}`.

**Testy:** TimelineFeed (14, +3 nowe asercje), MeetupRecommendations (11, +1 spec), matching_show_spec (8, zaktualizowany RSVP assert). Pełny suite **240/240 ✓**.

### Uwagi / odstępstwa / długi techniczne

- **To jest pierwsza fala UI polish** — backlogowane: Preact pack dla 3 popupów (boost/welcome/share, wciąż inline JS), multi-step onboarding E5→E6→E7, real Crayons tokens zamiast inline styles, hifi gradient palette, sparkles SVG, weights w rekomendacjach, frequency capping.
- **Matching_section w meetup hub** nie tknięty w tej fali — bez polish 1:1 z mockupem (gradient P1 card, "Zmień deklarację" dla P3, sparkle h2 icon). Fala 2.
- **Dot timeline** używa inline-styled `<span>` zamiast Crayons CSS class. Do polish.
- **`needs_intent` bez aggregation** — jeśli user ma 5 RSVP bez deklaracji, dostanie 5 wierszy w timeline. Aggregation per grupę meetupów — TODO.
- **Hero gradient overlay (0→0.55 black)** — na bardzo jasnych zdjęciach (śnieg/niebo) text staje się trudny do przeczytania. Polish dług: backdrop-filter blur lub dynamic overlay detection.
- **Relative date helper** — pluralizacja pl/en działa przez yaml count: pluralized hash. Helper bierze `count: delta` literal — Rails I18n.t obsługuje pluralization automatycznie po `count:`. Sprawdzone w 4 locales (pl ma one/few/many/other, en/fr/pt mają one/other).

---

## Etap 6 fala 2 — UI polish 1:1 z mockupem dla każdego ekranu

- **Status:** ✅ done (UI alignment dla wszystkich ekranów z mockupu poza E6 form + E7 success)
- **Commits:** `2be9f07e3` → `89f88c5a9` (16 commits)
- **Data:** 2026-05-27

### Zaimplementowane

**E1 lista wydarzeń (`/wydarzenia`):**
- Day header 1:1: duży `day.day` po lewej (40px bold), weekday + month UPPERCASE caps, horizontal rule, "X wydarzenia" count
- EventCard 3-col grid (88px time / 1fr title+venue+counts / 156px banner 16:9). Time column z border-right. "X z nietabu idzie · Y zainteresowanych", magenta "Bądź pierwszą osobą z nietabu" przy mini-pool
- ✨ Match-pool flag w EventCard (`X szuka kogoś`, brand color)
- RSVP overlay flag na bannerze top-left ("✓ Idziesz" zielony, "★ Interesuje cię" white blur)
- Matching banner u góry: P1 → "Załóż profil Matching" CTA, P2/P3 → "Twój profil Matching jest aktywny" link. Hidden po pierwszej stronie
- Submit-event banner mid-list (po drugim dniu) z mailto do `Settings::Community.email_address`
- "Pokaż kolejne wydarzenia" pagination button (PAGE_SIZE=20, offset-based)
- Controller pre-computuje counts maps: `@rsvp_status_by_meetup`, `@match_pool_by_meetup` (oba single query per page)

**E2 meetup hub (`/wydarzenia/<slug>`):**
- Hero 380px refactor: title 40px/800 weight, eyebrow "📅 SOBOTA · ZA 12 DNI" (relative date helper)
- Data format `%A, %-d %B %Y` ("sobota, 14 czerwca 2026") zamiast wcześniejszego dziwnego `:long`
- Meta row: avatar organizatora 44px round (fallback z initials) + "ORGANIZATOR" caps label + nazwa, button "Zobacz pełen opis na nietabu →" po prawej (`justify-content: space-between`)
- RSVP section "Wybierz swój udział" h2 + caption "Liczby dotyczą tylko deklaracji z platformy" po prawej, large buttons, counts row `28 z nietabu idzie · 17 zainteresowanych` z bold tokenami, sub-caption "Na evencie mogą być też osoby z innych kanałów."
- Going confirmation card (zielony tint z ✓ icon) gdy `rsvp=going`
- Divider'y między sekcjami (border-top zamiast crayons-card wrappers)
- Matching section 1:1 z mockupem (P1/P2/P3 stany): P1 gradient card z `X osób z nietabu szuka kogoś poznać` + body + duży CTA, P2 prompt + button (disabled-look + lock hint jeśli brak `going`), P3 active declaration card z label/intent/note + matches list inline
- `@match_pool_count` w controllerze (active declarations count dla P1 gradient card)
- h2 sekcji matching ma sparkle ✨ + "✏ Zmień deklarację" ghost button po prawej dla P3

**E3 match cards (w meetup hub):**
- `_match_card` przepisany na **vertical layout 1:1 z mockup** MatchCard (`components.jsx:342-365`): foto 1:1 z overlay'ami (identity pill top-left white blur, intent emoji circle top-right), body pod spodem z `identity · 📍 city` bold + intent line (opcjonalnie) + bio 2-line clamp + italic meetup_note 2-line clamp
- `_matches_list` regroupowany per `intent_level` (`open_to_meet` → "💬 Otwarci na poznanie", `just_vibe` → "🌙 Tylko klimat"). Każda grupa: overline + count + grid 3 cols (`auto-fill minmax(180px, 1fr)`)
- Header "X osób z nietabu pasuje do twojego filtra" (zamiast wcześniejszego "your_intent")
- `MatchingHelper#intent_emoji(level)` mapping: open_to_meet→💬, just_vibe→🌙, not_looking→🌑

**E15 event-scoped profile (`/m/<slug>/<id>`):**
- 2-col grid `minmax(280px, 360px) 1fr` z `gap: 32px`
- Left: photo 4:5 (`aspect-ratio: 4/5; border-radius: 12px`) z identity pill top-left + intent emoji circle top-right (white blur)
- Right column: back link "Wróć do dopasowań" + "DOPASOWANIE Z WYDARZENIA" overline + meetup name h2 brand color (klikalne) + meta date+venue+city + pill row (brand intent + outline city) + "O sobie" card + "Notatka na tym wydarzeniu" magenta-tinted card (conditional) + Welcome gradient card "Chcesz coś napisać?" + "✉ Napisz" button (handles eligible/already-sent/not-eligible)

**E8 dashboard (/matching) — dodatkowy polish:**
- Usunięte: header "✨ Twój Matching" + subtitle, timeline subheading caption, matches-count pill ("3 nowych dopasowań" w header)
- Profile header: foto 120×150 (było 96×120), h1 24px, status pill "Aktywny" brand color (zamiast moderation badge), italic bio, privacy hint
- Match_found z `count == 1` renderuje "single match" layout (portret 80×100 + pills row + meetup_note italic quote + "Zobacz profil →" button) zamiast grid
- Match_found z `count > 1` używa grid `auto-fill 160px` (cap 160px na tile — wcześniej blew up gdy joiners.length=1)
- Match_found payload rozszerzony o `:declarations` (poza `:joiners`) — pozwala single-layout pokazać `intent_level` + `meetup_note` z deklaracji joiner'a
- `needs_intent` event ma teraz pill po prawej obok meetup name (✓ Idę / ✓ Interesuje mnie z payload[:status])
- Wszystkie pille przez `MatchingHelper#pill_style(variant)` helper (solid/brand/brand_soft/magenta/success/warning/danger/outline) — bo `crayons-indicator` class w tym Forem buildzie nie ma `border-radius`

**Pile helper + flex between fix:**
- `MatchingHelper#pill_style(:variant)` zwraca inline style string z border-radius 100px + padding + background per variant
- 10 wystąpień `class="flex between..."` zamienione przez sed na `class="flex..." style="justify-content: space-between;"` — Crayons w tym Forem nie ma `between` class (Tailwind-style), więc h2+button rows były left-aligned z elementami stykającymi się zamiast space-between

**E5 onboarding intro (`/matching/onboarding`):**
- Nowa akcja `Matching::ProfilesController#intro` (`/matching/onboarding`)
- Formularz przeniesiony na `/matching/onboarding/form` (`#new` action, route helper `matching_onboarding_form_path`)
- View: gradient circle 96px z ✨ ikoną, h1 36px "Poznaj kogoś na wydarzeniu", tagline, 3 benefit cards (🔒 Pełna prywatność / 📅 Per wydarzenie / 💬 Bez nacisku) z icon w brand-soft background, privacy info-box (rozszerzona informacja o widoczności), CTAs: "Załóż profil Matching" → form + "Może później" → /wydarzenia
- `redirect_if_profile_exists` chroni intro (user z profilem → /matching dashboard)

**i18n (4 locales, ~70 nowych kluczy w sumie przez całą falę 2):**
- `matching.show.{profile_title, profile_active_pill, privacy_hint}` (header polish)
- `matching.timeline.{see_profile, kind_labels.*, events.rsvp_*_pill, match_found_caption, needs_intent_caption, declare_intent_button}` (timeline polish)
- `matching.matches.{pool_count, pool_count_tail, intent_groups.{open_to_meet, just_vibe}}` (matches list)
- `matching.event_scoped.{back, overline, about_section_label, write_card_title, write_card_body, write_button}` (E15)
- `matching.section.{p1.headline_html, p1.pool_count, p1.body, p1.cta, p2.*, p3.*}` (meetup hub matching section)
- `matching.onboarding.intro.{title, headline, tagline, benefits.{privacy, per_event, no_pressure}, privacy_html, cta_primary, cta_skip}` (E5 intro)
- `meetups.show.{back_to_list, counts_caveat, going_short, interested_short, going_verb, going_from_nietabu [pluralized], other_channels_hint, going_confirmation, going_confirmation_tail, relative.*}` (hero + RSVP section)
- `meetups.{day_count [pluralized], until, be_first_pill, match_pool [pluralized], load_more, rsvp_flag.{going, interested}, banner.{cta_*, active_*}, submit_event.*}` (E1 list)

### Uwagi / odstępstwa / długi techniczne

- **Brakuje E6 form polish + E7 success screen** — intro już wprowadzony (mockup E5), ale formularz nadal jest jednoekranowy bez "Krok 2 z 3" overline ani photo upload widget, a po `POST /matching/profile` redirect leci na `/matching` (zamiast dedicated E7 sukces "Profil wysłany do akceptacji"). To naturalna kontynuacja Etapu 6 fali 3.
- **Pille przez inline `pill_style` helper** — działa niezawodnie, ale jest workaround na brak Crayons indicator stylów w tym Forem. Idealnie: dodać CSS rules do `app/assets/stylesheets` matching tokens. Łatwo zmienić później bo helper centralnie zwraca string.
- **`flex between` → inline style** — to samo: workaround na brak Tailwind-style `between` w Forem Crayons. 10 miejsc; przy refaktorze CSS można usunąć `style="justify-content: space-between"` jak Crayons dorośnie do utility classes.
- **`config/routes.rb` wymaga restartu Rails dev server** — dodanie route na `intro` + `matching_onboarding_form_path` nie zostało zaciągnięte przez autoreload. Standardowa Rails konwencja, nie nasz bug. Restart wykonany w sesji.
- **Match cards grid `auto-fill 160px` (max-width 160px)** — gdy joinerów >= 4, mogą się nie zmieścić w 3 kolumnach na węższych desktopach. Action item: dorzucić "Zobacz wszystkich" footer link gdy joinerów > 3 (już jest dla `count > preview`).
- **Date format `%A, %-d %B %Y`** wymaga lokalizacji dla `%A` (dni tygodnia) i `%B` (miesiące) w yaml — działa po polsku ("sobota, 14 czerwca 2026"), po angielsku ("Saturday, 14 June 2026"). Sprawdzone w 4 locales.
- **Hero gradient overlay (rgba 0→0.55 black)** — przy jasnych zdjęciach (śnieg/niebo) text staje się trudny do przeczytania. Polish dług: backdrop-filter blur lub dynamiczny overlay.
- **`@new_matches_count` w MatchingController zostało usunięte** — pill "X nowych dopasowań" w profile header wyłączony per user request ("gdzie indziej zrobimy"). i18n key `matching.show.matches_count` zostawiony w yaml jako gotowy do reuse.
- **Boost flow + Welcome modal + Share popup wciąż na inline JS w ERB** — Preact packi to dalej dług polish.
- **Wszystkie ekrany czerpią styling z inline styles** zamiast Crayons tokenów. Powód: szybsze iterowanie podczas POC, no breakage w Forem CSS pipeline. Polish dług na produkcję.

### Acceptance check vs mockup

- ✅ E1 lista wydarzeń (DayHeader + EventCard 3-col + banners + RSVP overlay + match-pool flag + pagination)
- ✅ E2 meetup hub (hero 380px + meta + RSVP + matching P1/P2/P3 + share)
- ✅ E3 match cards (vertical tile + photo overlays + per-intent grouping)
- ✅ E5 onboarding intro (gradient hero + 3 benefits + privacy + CTAs)
- ✅ E8 timeline dashboard (header + dot timeline + match_found single/aggregated + recommendations + needs_intent)
- ✅ E15 event-scoped profile (2-col + photo 4:5 + about card + note card + write CTA)
- ✅ E6 form (Etap 6 fala 3 — overline + photo widget + chip-group identity + bio counter)
- ✅ E7 success (Etap 6 fala 3 — dedicated screen po `POST /matching/profile`)

---

## Etap 6 fala 3 — onboarding form/success + recommendations weights

- **Status:** ✅ done
- **Data:** 2026-05-27

### Zaimplementowane

**E6 form polish (`/matching/onboarding/form`) — 1:1 z hifi mockup (`screens.jsx:661`):**
- `new.html.erb` przepisany: `max-width: 580px`, overline "Krok 2 z 3" (`matching.onboarding.form_overline`), h1 36px "Twój profil Matching", 17px tagline "3 pola. Możesz to zmienić w każdej chwili."
- `_form.html.erb` przepisany w 4 sekcjach (zgodne z mockupem):
  - **Photo widget**: 140×175 (`aspect-ratio: 4 / 5`) dashed brand border placeholder z "+ Dodaj zdjęcie" labelem, klik otwiera ukryty `<input type="file">` (FileReader → live preview, placeholder znika, "Zmień zdjęcie" link). Helper text po prawej "Pojawi się tylko przed osobami…". `required` attr usunięty (HTML5 nie waliduje ukrytych inputów), model `validates :photo, presence: true` łapie braki.
  - **Identity chip-group**: 4 chipsy (Kobieta / Mężczyzna / Para / Osoba niebinarna) renderowane jako `<button type="button">`, klik ustawia hidden `:identity_type` field, selected = brand fill + ✓ ikona, unselected = pill z borderem. Style centralnie przez `MatchingHelper#matching_chip_style(selected)` (string przekazany do JS jako `to_json.html_safe` żeby toggle re-aplikował style po zmianie chipsa).
  - **City** — istniejący autocomplete partial (`/cities/search` debounced).
  - **Bio** — textarea z live counter `XX/200` (inline JS).
- Primary submit `Zapisz profil` (większy: 48px height, 14px 28px padding, 16px font, 200px min-width). Cancel button tylko gdy `persisted?` (mockup nie ma cancel w nowym formie).

**E7 success screen (`/matching/onboarding/success`) — 1:1 z hifi mockup (`screens.jsx:754`):**
- Nowa akcja `Matching::ProfilesController#success` z gardą `require_profile_for_success` (brak profilu → redirect na intro, więc strona dostępna tylko po stworzeniu profilu)
- View: gradient circle 96px (brand → magenta) z ✓ centered, h1 40px "Gotowe ✨", 17px body "Twój profil Matching trafił do akceptacji…", caption 14px o spodziewanej długości moderacji ("kilka godzin, email"), 2 CTA: primary "Przejdź do wydarzeń" (`meetups_path`) + outline "Zobacz mój profil" (`matching_path`)
- `Matching::ProfilesController#create` po `@profile.save` → `redirect_to matching_onboarding_success_path` (zamiast wcześniejszego `matching_path, notice: created`). I18n key `matching.profiles.created` zostaje w yaml jako gotowy do reuse (np. dla admin notice'ów), ale nie używany w success flow

**MeetupRecommendations weights + frequency capping:**
- Migracja `20260527180000_create_matching_recommendation_impressions` (user_id FK on_delete cascade, meetup_id FK on_delete cascade, shown_at, timestamps) + 2 indeksy: `(user_id, meetup_id, shown_at)` lookup, `(user_id, shown_at)` recency
- Model `MatchingRecommendationImpression` ze stałymi `RECENCY_WINDOW = 7.days` i `WEEKLY_CAP = 2`, scope `recent_for(user)` (`shown_at > 7.days.ago`)
- Service rozbudowany:
  - `Recommendation` struct dostaje 2 nowe pola: `score` (Integer), `reasons` (Array<Symbol>, np. `[:repeat_organizer]`)
  - Nowy parametr `record_impressions: false` — gdy `true`, po zwróceniu rekomendacji bulk `MatchingRecommendationImpression.insert_all` (jeden rekord per surfaced meetup_id)
  - **Repeat-organizer bonus** (`REPEAT_ORGANIZER_BONUS = 5`): zbiera `past_organizer_ids` z RSVP usera (organizer_user_id LUB organizer_organization_id), candidate z matchingującym organizerem → +5 do score, dorzuca `:repeat_organizer` do reasons
  - **Frequency cap**: `frequency_capped_meetup_ids` znajduje meetupy z `COUNT(impressions) >= 2 WHERE shown_at > 7.days.ago AND user_id = current` → wykluczone z base scope. Po 7 dniach impressions wypadają z okna i meetup może wrócić.
  - Sortowanie: `[-score, start_at]` (score = active_count + organizer_bonus; tie-break po dacie)
- Controller `MatchingController#show` woła service z `record_impressions: true` — każde otwarcie dashboardu zostawia ślad

**Testy (17 nowych w fali 3):**
- Request `Matching::Profiles` (5 nowych): E6 form (overline + submit), E7 success (renders / requires auth / no profile → redirect / no profile by auth required), create → redirect to success
- Service `MeetupRecommendations` (6 nowych): repeat-organizer boosts over equal-quiet stranger + reasons, no flag for unrelated organizers, frequency cap skips 2+ impressions, ignores >7d old impressions, `record_impressions: true` persists 1 row per rec, default no persistence

Pełny Matching POC suite: **251/251 ✓** (74 Etap 0–1, +37 Etap 2, +36 Etap 3, +39 Etap 4, +48 Etap 5, +17 Etap 6 fala 3)

### Uwagi / odstępstwa / długi techniczne

- **Chip-group identity przez inline JS w ERB** — działa, ale jest 3-ci komponent (po welcome modal i boost modal) który dorobi się jako Preact pack. Konwencja spójna z resztą POC.
- **`matching_chip_style` helper inlinowany do JS jako `to_json.html_safe`** — toggle chipsa potrzebuje pełnego string'a CSS żeby re-aplikować przy reselect. Idealnie: CSS class `.matching-chip[data-selected="true"]` + przełączanie atrybutu. Polish dług razem z `pill_style` i `flex between`.
- **Photo file input ukryty przez `position: absolute; opacity: 0`** zamiast `display: none` — HTML5 click event na `<label for>` propaguje do ukrytego inputu tylko gdy nie ma `display: none`. Trick z absolute + tiny size jest powszechny. `required` attr usunięty bo HTML5 nie waliduje hidden inputów — model `validates :photo, presence: true` łapie błąd.
- **`MatchingProfile.created` i18n nie wyświetlany po success** (przekierowanie na success screen zamiast flash notice) — ale klucz zostawiony w yaml, useable np. dla admin notice po `admin/matching_profiles#create` (hypothetical).
- **`require_profile_for_success` redirect → onboarding intro** — chronologia naturalna (user który zobaczył success → ma profil; user bez profilu na URL'u success → kierujemy na intro). Alternatywa: 404. Wybór UX: nie wystraszyć nowego usera.
- **Repeat-organizer bonus = stały `+5`** — magic number. Active counts in POC rzędu 0–10, więc bonus przesuwa zwykle 1 pozycję. Jeśli rośnie aktywność → albo skalować bonus, albo wprowadzić multiplikatywny score. Zostawione jako proste.
- **`record_impressions` opt-in** zamiast default true — bo nie chcemy impression'ów z testów ani od background workers (np. push notification trigger). Tylko canonical "user otworzył dashboard" → controller flaga ustawia.
- **`MatchingRecommendationImpression.insert_all` pomija callbacks** — model jest leaf (brak callbacks, brak counter cache), więc bezpiecznie.
- **Frequency cap nie wykryje "soft refresh"** — jeśli user otworzy dashboard 3 razy w 5 sekund, dostanie 3 impressions, dlatego >=2 w 7 dni capuje od razu. Świadome: nie polecaj tego samego meetupu drugi raz w tym samym tygodniu, niezależnie od częstotliwości otwarcia.
- **Brak "similar vibe" weight** (SPEC §12.13) — wymaga `looking_for`, kolumna zdropowana w Etapie 3. Wraca razem z `looking_for`.
- **FR/PT tłumaczenia "machinalne"**, ten sam dług co w Etapach 1–6 fali 2.

### Acceptance check vs mockup

- ✅ E6 form: overline "Krok 2 z 3" + h1 36px + tagline 17px + photo widget z live preview + identity chip-group + bio counter + duży primary submit (1:1 z `screens.jsx:661`)
- ✅ E7 success: gradient circle 96px + ✓ ikona + h1 40px "Gotowe ✨" + 17px body + duration caption + 2 CTA (1:1 z `screens.jsx:754`)
- ✅ Acceptance funkcjonalny: POST /matching/profile → redirect 302 na /matching/onboarding/success → user widzi success screen → klika CTA → meetups lub matching panel
- ✅ Recommendations: repeat-organizer bonus surfaces meetup od organizera u którego user był wcześniej; frequency cap (2× per 7d) wycina powtarzające się polecenia; service recordIs impressions gdy controller go tak woła

---

## Następny etap

**Etap 6 fala 4 — backlog polish + external sprint (poza obecny scope POC)**

Polish/techdebt (poza SPEC scope, opcjonalne na produkcję):
- Frontend: Preact pack dla 4 popupów (boost / E18 welcome / share / E6 chip-group + photo upload) zamiast inline JS w ERB
- Crayons tokens replace inline styles (widget meetupu, timeline, recommendation card, photo widget, chip-group, pill_style helper, `flex between` workaround w 10 miejscach)
- Hifi gradient palette dla `MeetupsHelper::BANNER_GRADIENTS` (obecnie placeholder)
- Sparkles SVG zamiast fire.svg jako matching tab icon
- Performance: indeksy + EXPLAIN dla `TimelineFeed` SQL i `MeetupRecommendations` przy realistic data volume (>100 meetupów per city, >1000 profili)
- Native i18n review (FR/PT) — wszystkie POC tłumaczenia "machinalne"
- Recommendations: skalowalny scoring (multiplicative zamiast additive bonus); diversity weight (nie pokazuj 3 meetupów tego samego organizatora); reason copy translation per locale

External sprint (poza Forem repo):
- **Cloud Function dla welcome message → chat Firebase** (Etap 4 dług) — Rails service `Matching::DeliverWelcomeViaCloudFunction` POST'uje do `ENV["MATCHING_WELCOME_CLOUD_FUNCTION_URL"]` ale CF nie deployowane. Bez CF: welcome rekord powstaje + UI pokazuje "wysłano", ale wiadomość do Firestore nie trafia.

---

## Etap 7 — Refactor pod Forem Preact-first + API dla mobile

> Decyzja sesji 2026-05-28: POC został zbudowany na inline JS w ERB. Forem-wide
> standard to Preact-first (AGENTS.md). Mobile native app będzie konsumować
> ten sam backend. Refactor dzieli się na 5 faz, każda osobny commit.

**Architektura docelowa:**

- **SSR (Rails ERB, indeksowane przez Google):**
  - `/meetups` (lista), `/meetups/:slug` (szczegóły meetupu z `name`/`date`/`venue`/`organizer`)
  - `/settings/matching` (settings tab, jak każdy inny)
  - `/matching/onboarding/*` (intro/form/success — shell SSR + Preact widgety w formie)

- **SPA (Preact + API, prywatne, bez SEO):**
  - `/matching` dashboard — pełny Preact app czytający z `/api/v1/matching/dashboard`
  - Wszystkie akcje na SSR stronach (RSVP, declaration, boost, welcome, share, photo upload, city autocomplete, identity chip) — Preact widgety mounted na SSR DOM

- **API namespace `/api/v1/matching/*` i `/api/v1/meetups/*`:**
  - Wzorzec Forem: `Api::V1::ApiController` < ApplicationController, `respond_to :api_v1`
  - Auth: `authenticate_with_api_key_or_current_user!` (web używa sesji, mobile dorzuca `api-key` header)
  - CSRF skipped, errors w jednolitym formacie (`{ error, status }`)

**Fazy:**

- **Faza 0 — Settings/matching ERB conformity (~30min):**
  Restructure `_matching.html.erb` do konwencji Forem (`crayons-card crayons-card--content-rows`, `crayons-subtitle-1`). API bez zmian — settings używa istniejących route'ów `POST/PATCH /matching/profile`.

- **Faza 1 — API + Preact DeclarationModal (~2-3h, proof of pattern):**
  - `Api::V1::Matching::DeclarationsController` z full CRUD (`GET/POST/PATCH/DELETE`)
  - `app/javascript/matching/api.js` (fetch wrapper z CSRF/api-key)
  - `app/javascript/matching/DeclarationModal.jsx` (Preact, state + intent + note + counter + errors)
  - `app/javascript/packs/matchingDeclarationModal.jsx` (pack entry, event delegation)
  - Wywalam inline JS z `_declaration_modal_loader` + endpoint `/meetups/:slug/declaration/modal`
  - Działa: `/matching` lub `/meetups/:slug` → klik "Dodaj intencję" → Preact modal → API → toast → soft refresh

- **Faza 2 — Meetup hub action widgets (~3-4h):**
  - API: RSVPs, Boosts, Welcomes, Cities (przeniesienie z `/cities/search` do `/api/v1/cities/search`)
  - Preact widgety mounted na SSR: RsvpButtons, BoostModal, WelcomeModal, SharePopup, CityAutocomplete (reusable)
  - Wywalam wszystkie inline JS popups z meetup hub i event-scoped profile

- **Faza 3 — /matching jako pełny SPA (~3-4h):**
  - API: `GET /api/v1/matching/dashboard` (combined endpoint: profile header + timeline + recommendations + counts)
  - `app/javascript/matching/Dashboard.jsx` + sub-komponenty (TimelineFeed, RecommendationCard, ProfileHeader)
  - Routes hub: `/matching` shellowany SSR (auth gate), Preact mountuje się na `<div id="matching-app">`

- **Faza 4 — Onboarding profile widgets (~2h):**
  - API: `Api::V1::Matching::ProfilesController` (CRUD + deactivate/reactivate)
  - Preact: PhotoUploader, IdentityChips, BioField (z counterem), CityAutocomplete (reuse z fazy 2)
  - Onboarding SSR shells (E5/E6/E7) hostują widgety przez `<div data-matching-onboarding-form>` mount point
  - Settings tab korzysta z tych samych widgetów albo zostaje na czystym Crayons input (zależnie od scope — patrz Faza 0)

- **Faza 5 — Mobile read API (~2-3h):**
  - `GET /api/v1/meetups` (lista z filtrami: city, date_range, organizer)
  - `GET /api/v1/meetups/:slug` (full meetup z RSVP/match counts)
  - `GET /api/v1/meetups/:slug/matches` (pool list, gated po user_profile)
  - `GET /api/v1/m/:meetup_slug/:profile_id` (event-scoped profile)
  - `GET /api/v1/matching/notification_settings` (mobile osobny screen settings)
  - Web zostaje SSR (read endpointy nie zmieniają flow web)

### Status faz

- ⏳ Faza 0 — Settings/matching ERB conformity (planowane)
- ⏳ Faza 1 — API + Preact DeclarationModal
- ⏳ Faza 2 — Meetup hub action widgets
- ⏳ Faza 3 — /matching jako pełny SPA
- ⏳ Faza 4 — Onboarding profile widgets
- ⏳ Faza 5 — Mobile read API

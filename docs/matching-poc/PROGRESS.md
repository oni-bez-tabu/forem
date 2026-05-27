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

## Następny etap

**Etap 5 — Timeline E8 + powiadomienia** (SPEC.md §11)

Zakres:
- Backend: event source dla E8 timeline (z lifecycle filter — wpisy znikają po 24h dla wygasłych meetupów)
- Frontend: pełen E8 (header profilu + chronologiczny timeline aktywności + wplecione rekomendacje meetupów)
- Push notifications: 2 kategorie (matching / nowe meetupy w mieście) z toggle ON by default w settings tab "✨ Matching"
- Acceptance: timeline pokazuje historię (RSVP, deklaracje, match found, welcome sent/received), push działa, toggles persistują

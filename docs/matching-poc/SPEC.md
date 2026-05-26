# Specyfikacja POC: Moduł Meetups + Matching dla nietabu — v2.3 (FINAL, post-design)

> **Status:** POC / MVP, post-design — wymaga implementacji
> **Cel:** Zwalidować czy "RSVP na meetup + deklaracja intencji + matching kontekstowy" generuje retencję i ruch na nietabu
> **Wersja:** 2.3 — FINAL. Wszystkie decyzje biznesowe rozstrzygnięte (sekcja 12 = potwierdzone, nie otwarte). Gotowe do przekazania Claude Code.
> **Powiązane:** makiety w `matching/project/hifi/` (canvas) + `prototype.html` (klikalny)

---

## 0. Instrukcja dla Claude Code (czytaj najpierw)

1. **Naming:** używamy słowa **`meetups`** w kodzie (tabele, modele, namespace, routy), bo nietabu jest oparty na **Forem, który ma już moduł "Events"** — żeby nie kolidować. W UI po polsku **"Wydarzenia"** — tylko warstwa prezentacji, kod = `meetups`.

2. **Zanim zaczniesz implementację**, przejdź przez:
   - Codebase nietabu — stack, ORM, User model, system chatu, uploadów, push notifications, system ról
   - **Istniejący moduł Forem `Events`** — zorientuj się czy jest aktywny, co konkretnie robi, czy są jakieś konwencje nazewnicze. Nawet jeśli go nie używamy bezpośrednio, dobrze wiedzieć żeby unikać kolizji
   - **System postów** — jak działają embedy/widgety (Forem ma **liquid tags** — sprawdź to pierwsze)
   - **System organizacji** — jak nietabu modeluje organizacje (Forem ma `Organization`)
   - Makiety w `matching/project/hifi/`

3. **Po analizie**, przed pisaniem kodu, wypisz:
   - Lista założeń o istniejącym systemie
   - Lista decyzji projektowych do podjęcia
   - Lista pytań do founder'a

4. **Hierarchia źródeł prawdy:**
   - **Ten dokument** = wymagania funkcjonalne (autorytatywny)
   - **Makiety hifi/** = wymagania wizualne (autorytatywne wizualnie)
   - **Repo nietabu** = źródło prawdy dla stylów, tokenów, konwencji. Z makiet bierzemy **wartości** dla **nowych** komponentów (EventCard, MatchCard, IntentCard, mesh banner gradients, timeline w E8)

5. **Out of scope POC:**
   - Verification (selfie / ID)
   - User-generated meetups
   - Linked accounts dla par
   - Self-service panel dla klubów

---

## 1. Kontekst i cel biznesowy

Nietabu to platforma społecznościowa do edukacji i komunikacji seksualnej. Problem: wolne narastanie zaangażowania. Hipoteza: Meetups + Matching dają silną pętlę powrotów (meetup = deadline).

**Co testujemy:**
- Czy userzy adoptują Matching jako sub-profil
- Czy mechanika deklaracji per meetup + reveal po mutual filter match działa w polskiej scenie kink/swing
- Czy user wraca w okolicy daty meetupu

**Metryki:**
- RSVP per meetup (Going / Interested)
- Conversion user nietabu → user Matching
- Conversion RSVP → declaration
- Mutual filter matches per meetup
- Welcome messages wysłane
- DAU/MAU userów z Matching vs bez
- Retention: powrót w ciągu 7 dni od ostatniego meetupu

---

## 2. Zakres POC

### W zakresie

**Moduł Meetups (w UI: "Wydarzenia"):**
- Lista meetupów (agenda view z day headers)
- Meetup hub (E2/E3/E4)
- RSVP (Going/Interested) — popup-based
- Banery: upload przez admina LUB auto-gen mesh gradient
- Link do pełnego opisu: wewnętrzny post nietabu LUB zewnętrzny URL (XOR)
- Słownik miast (sekcja 4.7) — wspólny dla meetupów i Matching
- **Lifecycle wygasania (sekcja 6.5)** — meetup znika z list 24h po końcu, profile event-scoped wygasają 48h po końcu

**Moduł Matching:**
- Opt-in sub-profil + onboarding (4 pola)
- Deklaracja intencji per meetup (3 intencje)
- Deklaracja dla obu statusów RSVP (going + interested)
- Lista kompatybilnych matchów inline w meetup hubie
- **Profil Matching widziany przez innych jest zawsze event-scoped** (sekcja 5.G + sekcja 6.6)
- Welcome message — pre-baked text, 1x per pair, wysyłany do istniejącego chatu z konta nadawcy z linkiem do event-scoped profilu Matching
- Mój Matching: timeline aktywności + rekomendacje

**Integracja z chrome nietabu:**
- Ikona ✨ w nav (z badge)
- Karta Matching w avatar dropdown
- Zakładka "✨ Matching" w Ustawieniach (warunkowa)

**Boost flow + widget meetupu w poście (nowość)**

**Admin panel:**
- CRUD meetupów + upload bannera + statystyki
- Lista profili Matching + dezaktywacja/usuwanie
- Logika: zbanowany user nie tworzy profilu Matching (auto-dezaktywacja istniejącego po banie)
- Admin widzi wszystkie meetupy bez wygasania (sekcja 6.5)

### Świadomie poza zakresem POC
- Verification, user-generated meetups, linked accounts par, self-service klubów, linking profil Matching ↔ nietabu, no-show tracking, email notifications, per-typ konfiguracja powiadomień

---

## 3. Architektura wysokopoziomowa

```
nietabu (istniejące — nie ruszamy)
├── user (auth, profil, weryfikacja 18+, ban status)
├── chat (istniejący — używamy do welcome message, BEZ modyfikacji)
├── settings (istniejące — dodajemy zakładkę "✨ Matching" warunkowo)
├── nav header + avatar dropdown (istniejące — wstrzykujemy ikonę ✨)
├── posts (istniejące — boost flow tworzy post z osadzonym widgetem)
├── organizations (istniejące — używamy jako organizer meetupu)
├── push notifications (istniejące — triggery Matching/Meetups)
└── ⚠️ Forem `Events` (istniejące, NIE używamy — kolizja nazewnicza, dlatego nasze = meetups)

NOWE:
├── cities (słownik)
├── meetups
│   ├── meetups
│   └── meetup_rsvps
├── matching
│   ├── matching_profiles
│   ├── meetup_matching_declarations
│   └── matching_welcomes (tracking only)
└── post widgets
    └── meetup_post_widget (nowy typ embedu w postach)
```

---

## 4. Model danych

### 4.1 `meetups`

| Pole | Typ | Opis |
|---|---|---|
| id | uuid/int | PK |
| slug | string | Unique, do URLi (`/wydarzenia/{slug}`) |
| name | string | Nazwa |
| organizer_id | polymorphic FK | Organizacja LUB user. Claude Code: po analizie kodu zaproponuj konkretną implementację (polymorphic `organizer_type` + `organizer_id`, lub XOR pól) |
| venue_name | string | |
| venue_city_id | FK cities | |
| venue_address | string nullable | |
| start_at | datetime | |
| end_at | datetime | |
| banner_url | string nullable | Upload; null → auto-gen |
| banner_gradient | enum | `dusk` \| `velvet` \| `ember` \| `night` \| `olive` \| `sunrise` (default: hash(id)) |
| description_link_type | enum | `internal` \| `external` |
| description_internal_post_id | FK posts nullable | |
| description_external_url | string nullable | |
| is_published | bool | |
| created_by | FK user | Admin |
| created_at, updated_at | datetime | |

**Constraint:** `(description_link_type='internal' AND description_internal_post_id IS NOT NULL) OR (description_link_type='external' AND description_external_url IS NOT NULL)`

### 4.2 `meetup_rsvps`

| Pole | Typ | Opis |
|---|---|---|
| id | uuid/int | PK |
| meetup_id | FK meetups | |
| user_id | FK user | |
| status | enum | `going` \| `interested` |
| created_at, updated_at | datetime | |

**Constraint:** unique (meetup_id, user_id)

### 4.3 `matching_profiles`

| Pole | Typ | Opis |
|---|---|---|
| id | uuid/int | PK |
| user_id | FK user | Unique |
| photo_url | string | |
| identity_type | enum | `woman` \| `man` \| `couple` \| `non_binary` |
| city_id | FK cities | Może wskazywać "everywhere" 🌍 |
| bio | string(200) nullable | |
| is_active | bool | Default true |
| created_at, updated_at | datetime | |

**Zasady:**
- User zbanowany **nie może** utworzyć profilu Matching → POST `/matching/profile` zwraca 403
- Ban istniejącego usera → automatyczna dezaktywacja jego profilu Matching (`is_active = false`)
- 18+ weryfikowane na poziomie konta nietabu (auth)

### 4.4 `meetup_matching_declarations`

| Pole | Typ | Opis |
|---|---|---|
| id | uuid/int | PK |
| meetup_id | FK meetups | |
| matching_profile_id | FK matching_profiles | |
| intent_level | enum | `not_looking` \| `just_vibe` \| `open_to_meet` |
| looking_for | jsonb/array nullable | |
| meetup_note | string(200) nullable | |
| created_at, updated_at | datetime | |

**Constraint:** unique (meetup_id, matching_profile_id)
**Constraint:** declaration wymaga aby istniał `meetup_rsvp` (any status — `going` lub `interested`) na tym samym (meetup_id, user_id) gdzie `user_id` z matching_profile

### 4.5 `matching_welcomes`

| Pole | Typ | Opis |
|---|---|---|
| id | uuid/int | PK |
| sender_profile_id | FK matching_profiles | |
| receiver_profile_id | FK matching_profiles | |
| meetup_id | FK meetups | Kontekst |
| sent_at | datetime | |

**Constraint:** unique (sender_profile_id, receiver_profile_id) — bez meetup_id w kluczu. "Raz na osobę nigdy więcej".

**Cel:** tylko tracking — blokowanie ponownego wysłania + UI info "wysłałeś już zaproszenie". Tabela NIE jest powiązana z konwersacją w chacie.

### 4.6 Chat — nietknięty

Chat nietabu nie wymaga żadnych modyfikacji. Welcome message to zwykła wiadomość tekstowa wstawiana do istniejącego systemu z konta nadawcy (sekcja 7.3).

### 4.7 `cities` (słownik)

| Pole | Typ | Opis |
|---|---|---|
| id | int | PK |
| name | string | Np. "Warszawa" |
| slug | string | Np. "warszawa" |
| name_normalized | string | Bez polskich znaków, lowercase |
| voivodeship | string nullable | |
| is_special | bool | True dla "🌍 Wszędzie" |
| population_hint | int nullable | Do sortowania autocomplete |

**Seed (FINAL):**
- Źródło: **Geonames PL** — https://download.geonames.org/export/dump/PL.zip (gotowy CSV, łatwy import)
- Filtr: **populacja ≥ 5000** (daje kilkaset miast — wystarczająco, nie zaśmieca autocomplete tysiącami wsi)
- Plus jeden specjalny rekord `is_special=true, name='🌍 Wszędzie', slug='everywhere'`
- Import jednorazowy — skrypt seedujący uruchamiany raz przy wdrożeniu

**Endpoint:** `GET /cities/search?q=war` → lista pasujących, sortowana `population_hint DESC`, limit 10. Match po `name_normalized` z lowercase + bez polskich znaków na query.

---

## 5. User flows

### Flow A: Lista meetupów
Bez zmian — agenda view z day headers, EventCard horyzontalny, banner Matching i submit-event banner, klik → meetup hub. Bez filtrów w POC.

### Flow B: Meetup hub (E2/E3/E4)
Hero + meta + CTA "Zobacz pełen opis" (internal/external) + sekcja RSVP + sekcja Matching. Patrz v2 dla detali.

### Flow C: RSVP click (popup-based)

**C.1 — P1 (bez Matching profile):**
- Popup `NoProfilePopup` → CTA "Załóż profil" (→ D) lub "Może później" → RSVP zapisany + Share popup (C.4)

**C.2 — P2/P3 (z profilem Matching, brak deklaracji na ten meetup):**
- Popup `IntentPopup` (E10) → zapis → RSVP + declaration + Share popup (C.4)
- "Anuluj" → RSVP zapisany, declaration nie powstaje, **brak** Share popup
- **Dotyczy obu statusów RSVP** (going + interested) — declaration jest możliwa dla obu

**C.3 — Cofnięcie RSVP** (klik tego samego statusu drugi raz):
- RSVP usunięty, declaration **pozostaje** (user może wrócić)
- Brak popupów

**C.4 — Share popup:**
- "Udostępnij na nietabu" → boost popup z pustym polem (sekcja 8)
- "Skopiuj link" → kopiuje `nietabu.pl/wydarzenia/{slug}` + toast

### Flow D: Onboarding Matching
4 pola: zdjęcie, identity, city (searchable autocomplete na `cities`), bio. Backend sprawdza `user.is_banned` przy zapisie. Bez zmian względem v2.

### Flow E: Deklaracja intencji (E10)
3 sekcje: intencja (3 cards), kogo szukasz (multi-select, ukryte/wyszarzone zależnie od intencji), notatka (ukryta dla `not_looking`).

### Flow F: Lista matchów inline w meetup hubie
Header (liczba + własna intencja + "Zmień deklarację") + 2 grupy (✦ Pasują do twojej intencji / Inni którzy też się zadeklarowali). Karta: zdjęcie 4:5, identity pill, 📍 city pill, intent label, bio teaser, meetup_note, klik → E15.

### Flow F': Partial (Interested + Matching profile, bez deklaracji)
Karty z zablurowanym zdjęciem, dane widoczne (identity, city, intent, bio), brak "Napisz", CTA "Zadeklaruj intencję".

### Flow G: Profil matcha (E15) + welcome message

**Profil matcha jest zawsze event-scoped** — sekcja 6.6 niżej.

URL: `/m/{meetup_slug}/{matching_profile_id}` — np. `/m/czerwony-wieczor-2026-06-14/abc123`. 

**E15 zawiera:**
- Zdjęcie (hero), identity pill, 📍 city pill, bio (pełne)
- **Intent label + meetup_note z deklaracji TEGO konkretnego meetupu** — nie globalne dane
- Kontekst meetupu: "Dopasowanie z: {meetup.name} · {data}" (klikalne → meetup hub)
- CTA **"Wyślij powitalną wiadomość"** lub jeśli już wysłano: **"Wysłałeś już zaproszenie do rozmowy"** (disabled)

**Klik CTA → E18 modal:**
- Niedytowalny podgląd treści welcome
- Sekcja "Co się stanie po wysłaniu"
- Warning "Można wysłać raz na osobę"
- Buttony "Wyślij" / "Anuluj"

**E18 — 3 stany:** compose → sending (loader z kopertą) → success.

**Backend flow przy "Wyślij":** patrz sekcja 7.3.

### Flow H: Mój Matching (E8)
Kompaktowy header profilu + chronologiczny timeline aktywności + wplecione rekomendacje meetupów. Bez zmian względem v2.

### Flow I: Integracja z chrome nietabu
Bez zmian względem v2.

---

## 6. Logika widoczności i matchingu (REGUŁY)

### R1: Visibility
A widzi B na meetupie M IFF:
1. A, B mają `matching_profile.is_active = true`
2. A, B mają RSVP (any status) na M
3. A, B mają deklarację na M
4. A.intent_level ≠ `not_looking`
5. B.intent_level ≠ `not_looking`
6. B.identity_type ∈ A.looking_for
7. A.identity_type ∈ B.looking_for (z wyjątkami dla `just_vibe` — R3)

### R2: Grupowanie
- Grupa 1: ten sam intent_level
- Grupa 2: różne intent_level, ale filter match nadal działa

### R3: Just_vibe
- JEST widoczny w listach innych (z markerem "nie szuka aktywnie")
- `looking_for` traktowane jako "wszystkie" jeśli puste
- Może otrzymać welcome

### R4: Not_looking
- NIE widzi listy matchów, NIE pojawia się w listach, NIE może wysłać/otrzymać welcome
- Deklaracja istnieje tylko do statystyk

### R5: Pełna logika grupowania
Dla A (intent ∈ {`open_to_meet`, `just_vibe`}):
- Grupa 1: B spełnia R1 + B.intent_level == A.intent_level
- Grupa 2: B spełnia R1 + B.intent_level ≠ A.intent_level

Pusta grupa 1 + pełna grupa 2 → tylko grupa 2. Obie puste → empty state.

### R6: Symetria + asymetria just_vibe
Dla `open_to_meet` ↔ `open_to_meet`: symetria. Dla mieszanego `just_vibe`: traktowany jako mający `looking_for = wszystkie`.

### R7: Welcome lockout
**Welcome NIE może być wysłany po wygaśnięciu profilu event-scoped** (48h po `end_at` — R-Lifecycle niżej). POST `/matching/welcomes` po tym terminie zwraca 404.

### R8: Pary (`couple`)
Jedno konto, jedno zdjęcie. Welcome dla pary: ta sama treść uniwersalna.

### **R-Lifecycle: Wygasanie meetupów i event-scoped Matching profile (KLUCZOWE)**

Dwa rodzaje wygaśnięć, dwa różne okna:

#### R-Lifecycle.1: Wygaśnięcie meetupu z list i aktywności (24h po `end_at`)

Po `end_at + 24h`:
- **Meetup znika z listy publicznej** (E1) — endpoint `GET /meetups` filtruje meetupy z `end_at + 24h > now()`
- **Meetup znika z timeline aktywności w E8** — wpisy `RSVP`, `Declaration`, `Match found` dla tego meetupu nie pokazują się
- **Recommendation feed** nie poleca już tego meetupu
- **Meetup hub `/wydarzenia/{slug}` zwraca 404** dla zwykłych userów (nie-adminów) — standardowy not-found nietabu, BEZ specjalnego ekranu "wygasło".
- **Widget meetupu w postach** (osadzony w starych postach na nietabu) — może pozostać widoczny, ale w stanie "zakończone" (klik prowadzi do standardowego 404)

#### R-Lifecycle.2: Wygaśnięcie event-scoped Matching profile (48h po `end_at`)

Po `end_at + 48h`:
- **Endpoint widoku profilu Matching `/m/{meetup_slug}/{profile_id}` zwraca 404** dla zwykłych userów — standardowy not-found
- **Link w welcome message przestaje działać** (klik → standardowy 404 nietabu)
- **POST `/matching/welcomes` zwraca 404** — nie można wysłać welcome jeśli profil event-scoped już wygasł
- **Konwersacja w chacie pozostaje** (chat to chat nietabu, niezależny) — userzy mogą dalej pisać, ale **bez kontekstu eventu**

#### R-Lifecycle.3: Okno 24h-48h
Między 24h a 48h po `end_at`:
- Meetup już zniknął z list
- Ale linki do event-scoped Matching profile **wciąż działają**
- User może wejść w stary welcome z chatu, otworzyć profil matcha, dokończyć rozmowę
- Nowy user nie ma jak trafić na meetup (bo go nie ma na liście) — to celowe

#### R-Lifecycle.4: Admin
Admin **widzi wszystko zawsze**:
- Pełna lista meetupów (z filtrem nadchodzące / przeszłe / nieopublikowane) w admin panel
- Profile Matching event-scoped są dostępne dla admina przez backend (np. `/admin/meetups/{id}/declarations` lub przez admin panel)
- Statystyki per meetup obliczane są na wszystkich danych (przed i po wygaśnięciu)

#### R-Lifecycle.5: Implementacja
- **Soft "wygaśnięcie"** — meetupy i declarations **NIE są usuwane** z bazy. Wygasanie to logika na poziomie endpointów i filtrów query.
- Wszystkie endpointy publiczne mają standardowy filtr "is_expired?" zależny od kontekstu (24h dla meetupów na liście, 48h dla event-scoped profili)
- Background job może oznaczać meetupy jako "archived" dla wygody (opcjonalnie), ale dane pozostają

### R9: Post-meetup chat
Konwersacje w istniejącym chacie pozostają aktywne na zawsze (chat nietabu nie wie o lifecycle Matching). Userzy mogą dalej pisać po wygaśnięciu meetupu i event-scoped profili — tylko nie mogą już otworzyć linku do profilu Matching ani kontekstu eventu.

---

## 7. Powiadomienia

### 7.1 Triggery

**Kategoria 1: Matching** (toggle ON by default)
- Push przy każdej nowej osobie w pool usera (na meetupie gdzie user ma deklarację `open_to_meet` lub `just_vibe`)
- Treść: "Nowe dopasowanie na {meetup.name}"
- Brak debounce w POC (każda nowa osoba = push)
- W timeline E8 agregacja per ~60s okno → "3 nowe dopasowania"

**Kategoria 2: Meetupy** (toggle ON by default)
- Push przy publikacji nowego meetupu w mieście usera (`meetup.venue_city_id == matching_profile.city_id`)
- User z `city_id = "everywhere"` → push o **wszystkich** nowych meetupach
- Treść: "Nowe wydarzenie w {miasto}: {meetup.name} — {data}"
- Trigger: gdy admin publikuje (`is_published` zmienia się na true)

**Welcome message** — push pochodzi z istniejącego push systemu chatu nietabu (zwykła wiadomość). Nie traktujemy osobno.

### 7.2 Ustawienia
Zakładka "✨ Matching" w Ustawieniach:
- Toggle 1: "Powiadomienia o nowych dopasowaniach"
- Toggle 2: "Powiadomienia o nowych wydarzeniach w moim mieście"

### 7.3 Welcome message — backend flow

**Endpoint `POST /matching/welcomes`:**
```
body: { receiver_profile_id, meetup_id }
```

**Logika:**
1. Walidacja:
   - R1 (compatibility), R4 (not_looking blocker)
   - Czy nie istnieje `matching_welcomes(sender, receiver)` — 409 jeśli istnieje
   - Czy `now() < meetup.end_at + 48h` (R-Lifecycle.2) — 404 jeśli przekroczone
2. Generacja treści z templatu (sekcja 7.4)
3. **Wstawienie wiadomości do istniejącego chatu nietabu z konta `sender_profile.user_id`** — używamy istniejącego API/serwisu nietabu do tworzenia wiadomości w chacie
4. Tworzenie rekordu w `matching_welcomes`
5. Push do odbiorcy — robi to istniejący chat system

### 7.4 Template welcome

```
Hej, planujemy wybrać się na to samo wydarzenie, może warto pogadać wcześniej?

Mój profil Matching: {url_do_event_scoped_profilu}
```

**URL do event-scoped profilu Matching nadawcy:**
- Format: `https://nietabu.pl/m/{meetup_slug}/{sender_profile_id}`
- Działa przez 48h po `meetup.end_at`
- Po wygaśnięciu → standardowy 404 nietabu

**Uwagi:**
- Treść uniwersalna (kobieta/mężczyzna/para/non_binary)
- Wiadomość wysyłana z konta nietabu nadawcy (nie anonimowo)
- Anonimowość zachowuje *event-scoped profil Matching* (link), nie sama wiadomość

---

## 8. Boost flow + widget meetupu w poście (NOWOŚĆ)

### 8.1 Zadanie dla Claude Code: research

Przed implementacją widgetu meetupu, Claude Code musi:
1. Zbadać codebase nietabu pod kątem istniejących embedów/widgetów w postach:
   - **Forem ma "liquid tags"** — to pierwszy trop. Sprawdź jak działają (np. `{% github user/repo %}`, `{% youtube url %}`)
   - Czy nietabu używa custom liquid tags?
   - Jak działa link preview, embed YouTube w postach nietabu?
2. Wypisać znaleziska
3. Zaproponować implementację widgetu meetupu zgodną z istniejącym wzorcem

### 8.2 Co widget ma robić (functional requirements)

Widget meetupu w poście pokazuje:
- Cover thumbnail (banner meetupu, mały)
- Nazwa meetupu (klikalna → meetup hub)
- Data + godzina
- Miasto + lokal
- Status RSVP autora posta (jeśli istnieje):
  - "✓ Idzie" / "✓ Interesuje go"
- CTA inline: "Zobacz wydarzenie →"

**Brak interakcji w widgecie** w POC (np. nie można RSVP'ować z widgetu — trzeba przejść do meetup huba).

### 8.3 Render w 3 kontekstach
Feed / profil usera / pojedynczy post — wszędzie ten sam wygląd (responsywny).

### 8.4 Wygasanie widgetu
Po `meetup.end_at + 24h` (R-Lifecycle.1):
- Widget renderuje się w stanie "wydarzenie zakończone" (greyed out, bez CTA "Zobacz")
- Klik na nazwę → standardowy 404
- Stare posty z widgetami pozostają, tylko widget zmienia wygląd

### 8.5 Boost flow

Share popup → "Udostępnij na nietabu" → **popup boostowania**:

**Zawartość popupu:**
- Header: "Udostępnij na nietabu"
- **Puste pole tekstowe** — user pisze treść posta sam, od zera. BEZ pre-fillu. Placeholder może być neutralny, np. "Napisz coś o tym wydarzeniu...".
- Widget meetupu osadzony pod polem tekstowym (nieedytowalny — integralna część posta boost'owego)
- Buttony: "Opublikuj" / "Anuluj"

> **Decyzja:** żadnego pre-fillu treści. User w 100% kontroluje co pisze. Widget meetupu (z danymi: nazwa, data, miejsce, banner, status RSVP autora) jest jedynym automatycznym elementem posta.

**Po publikacji:** backend tworzy zwykły post nietabu z treścią + osadzonym widgetem. Frontend zamyka popup, toast "Opublikowano. Zobacz na swoim profilu →".

### 8.6 Implementacja widgetu — wskazówki

**Sugestia:** jeśli nietabu używa Forem liquid tags, dodaj nowy: `{% meetup {slug} %}`. Renderer pobiera dane meetupu, renderuje widget. Klucz: **slug**, nie ID — żeby był human-readable.

Dane potrzebne do renderu: meetup_id (lub slug), kontekst posta (`posts.user_id` do sprawdzenia RSVP status autora).

---

## 9. Admin panel

### 9.1 Funkcje must-have

**Meetupy:**
- Lista (filtry: nadchodzące / przeszłe / nieopublikowane — admin widzi wszystkie bez wygasania)
- Formularz add/edit z wszystkimi polami z `meetups` table:
  - Picker organizatora (autocomplete organizacji LUB usera)
  - Picker miasta (autocomplete `cities`)
  - Upload bannera lub wybór gradientu auto-gen
  - Picker linku internal (post nietabu) lub external URL
- Toggle `is_published`
- Hard delete z confirmation
- Statystyki per meetup: Going/Interested counts, declarations breakdown (intent_level + identity_type), welcome messages sent

**Profile Matching:**
- Lista wszystkich profili (filtry: active/inactive/banned user)
- Per profil akcje:
  - Dezaktywuj (toggle `is_active`)
  - Usuń (hard delete, kaskada deklaracji i welcome messages)
- Info: user nietabu, status banu, daty

### 9.2 Logika ban → auto-dezaktywacja
Gdy admin banuje konto nietabu (przez istniejący panel) → automatyczna dezaktywacja jego profilu Matching (`is_active = false`). Implementacja: hook/listener na zmianę statusu banu.

### 9.3 Permissions
Admin panel dla userów z rolą `admin` (zakładam istniejący system — do potwierdzenia).

---

## 10. UI / Lista ekranów

| Funkcja | Ekran | Lokalizacja |
|---|---|---|
| Lista meetupów | E1 | `/wydarzenia` (UI: "Wydarzenia") |
| Meetup hub | E2/E3/E4 | `/wydarzenia/{slug}` |
| Onboarding Matching | E5→E6→E7 | `/matching/onboarding` |
| Mój Matching | E8 | `/matching` |
| Edycja profilu | (zakładka) | `/settings/matching` |
| Deklaracja intencji | E10 (popup) | nakładka |
| Lista matchów | (inline w E3) | sekcja w `/wydarzenia/{slug}` |
| **Profil matcha (event-scoped)** | **E15** | **`/m/{meetup_slug}/{profile_id}`** |
| Welcome message | E18 (modal) | nakładka |
| Empty state | E16 | gdy brak |
| Boost popup | (nowy) | nakładka po Share |
| Widget meetupu | (w postach) | render w postach |
| (wygasłe meetupy/profile) | — | standardowy 404 nietabu, BEZ dedykowanego ekranu |

**Styl:**
- Repo nietabu = źródło prawdy dla istniejących komponentów
- Z makiet hifi/ = wartości dla nowych komponentów (EventCard, MatchCard, IntentCard, mesh gradients, timeline E8, IntentBadge, IdentityChip, PrivacyInfoBox, share popup, boost popup, widget meetupu)
- Dark mode — komponenty muszą używać tokenów

---

## 11. Sugerowana kolejność implementacji

**Etap 0: Cities słownik** (3-5 dni)
- Migracja `cities`
- Seed z Geonames PL (próg ≥5000) + rekord "Wszędzie"
- Endpoint `GET /cities/search`
- Acceptance: autocomplete działa

**Etap 1: Meetups fundament + admin** (1.5-2 tyg)
- Migracje `meetups`, `meetup_rsvps`
- Picker organizatora (zależny od modelu organizacji)
- API CRUD meetups + RSVP endpoints
- **Lifecycle filters** w endpointach publicznych (24h dla list, 48h dla event-scoped)
- Admin panel: CRUD + statystyki
- Frontend user: E1 + E2 + RSVP popup (P1 + share popup z "Skopiuj link")
- Wygasłe meetupy → standardowy 404
- Acceptance: admin dodaje meetup, user RSVP'uje, kopiowanie linku działa, po 24h meetup znika z list

**Etap 2: Matching profile + integracja chrome** (1.5-2 tyg)
- Migracja `matching_profiles`
- Ban check przy tworzeniu + hook auto-dezaktywacji
- API CRUD profil + upload
- Admin: lista profili Matching
- Frontend: E5→E6→E7 + E8 uproszczona
- Integracja chrome: ikona ✨, dropdown, zakładka ustawień
- Acceptance: user zakłada profil, admin zarządza, ban → dezaktywacja

**Etap 3: Deklaracje + visibility + lista matchów inline + event-scoped profil** (2-3 tyg)
- Migracja `meetup_matching_declarations`
- API CRUD deklaracji + endpoint listy matchów z R1-R8
- **Endpoint `GET /m/{meetup_slug}/{profile_id}`** — event-scoped profil z lifecycle 48h
- Wygasłe event-scoped profile → standardowy 404
- Frontend: E10 popup + E3/E4 inline lista + E15 event-scoped profil + F' (partial blurred)
- Popup-based RSVP flow z deklaracją dla obu statusów
- Acceptance: P2 klika RSVP → popup intencji → zapis → lista; P3 widzi grupy; profil matcha pokazuje meetup_note z konkretnego meetupu

**Etap 4: Welcome + Boost + Widget meetupu** (2-3 tyg)
- Migracja `matching_welcomes`
- API `POST /matching/welcomes` z lifecycle check (48h)
- Frontend E18: compose → sending → success
- Widget meetupu w poście (po analizie codebase'u — sugerowany liquid tag jeśli Forem)
- Boost popup
- Wygasanie widgetu po 24h
- Acceptance: user wysyła welcome z linkiem do event-scoped profilu, druga strona widzi w chacie, link działa do 48h, po → 404; user boost'uje RSVP z osadzonym widgetem

**Etap 5: Timeline E8 + powiadomienia** (1-1.5 tyg)
- Backend: event source dla E8 timeline (z lifecycle filter — wpisy znikają po 24h dla meetupów)
- Frontend: pełen E8
- Push: 2 kategorie z toggle
- Acceptance: timeline pokazuje historię, push działa

**Etap 6: Rekomendacje + polishing** (1-1.5 tyg)

**Razem: ~10-13 tygodni**

---

## 12. Otwarte pytania (do rozstrzygnięcia z Bartkiem)

### Techniczne
1. Stack, ORM, baza?
2. User: model, weryfikacja 18+, flaga ban?
3. **Organizacje:** model w nietabu (Forem ma `Organization`)?
4. **Liquid tags w nietabu:** używamy? Jakie istnieją?
5. **Boost flow:** czy nietabu ma istniejący "share to post"? Tworzymy od zera?
6. Push infrastructure: FCM/APNs?
7. Upload: S3, lokalnie?
8. Role: jak admin?
9. Mobile: web only POC?
10. **Forem `Events` module:** czy w nietabu jest aktywny? Jak unikamy kolizji na poziomie routów (`/events` vs nasze `/wydarzenia` które routują do `meetups`)?

### Biznesowe — ROZSTRZYGNIĘTE (decyzje founder'a, nie pytaj o nie)

Wszystkie decyzje biznesowe zostały podjęte. Poniżej dla referencji — Claude Code traktuje je jako wiążące:

11. **Wygasłe meetupy / event-scoped profile** → standardowy **404** nietabu. BEZ dedykowanego ekranu "wygasło", bez specjalnego copy. Zwykły not-found.
12. **Boost post** → **brak pre-fillu**. User pisze treść w 100% sam. Widget meetupu osadzony automatycznie pod polem tekstowym.
13. **Algorytm rekomendacji v1** → **pool-based** (meetupy gdzie kompatybilni z `looking_for` usera już się zadeklarowali). Pozostałe algorytmy (similar-vibe, repeat-organizer) → backlog.
14. **URL event-scoped profilu** → **`/m/{meetup_slug}/{profile_id}`** (krótki, semantyczny).
15. **Cities seed** → **Geonames PL**, próg populacji **≥ 5000**.
16. **Welcome unique constraint** → **per osoba na zawsze**: `unique(sender_profile_id, receiver_profile_id)`, BEZ meetup_id w kluczu. Raz wysłane powitanie do danej osoby = nigdy więcej, niezależnie od meetupu.
17. **Ban → profil Matching** → ban konta nietabu **automatycznie dezaktywuje** profil Matching (`is_active=false`).
18. **"Anuluj" w popupie intencji** → RSVP **zostaje zapisany**, declaration nie powstaje. User może wrócić i zadeklarować później.

---

## 13. Glossary

- **Meetup** — wydarzenie (UI: "Wydarzenie"), nazwa kodowa wybrana aby uniknąć kolizji z Forem `Events`
- **RSVP** — going/interested
- **Matching profile** — opt-in sub-profil
- **Declaration** — intencja + filter na konkretny meetup
- **Intent level** — `not_looking` / `just_vibe` / `open_to_meet`
- **Identity type** — `woman` / `man` / `couple` / `non_binary`
- **Looking for** — multi-select identity_types
- **Pool** — userzy z deklaracją (intent ≠ not_looking) na meetupie
- **Welcome message** — pre-baked text, 1x per pair, do istniejącego chatu
- **Event-scoped Matching profile** — profil Matching widziany przez innych jest zawsze w kontekście konkretnego meetupu (URL `/m/{slug}/{id}`, z `meetup_note` z deklaracji na ten meetup). Wygasa 48h po `end_at`.
- **R-Lifecycle** — meetup znika z list po 24h, event-scoped profil wygasa po 48h, admin widzi wszystko zawsze
- **Boost** — flow tworzenia posta nietabu z widgetem meetupu
- **Meetup widget** — embed w poście nietabu (sugerowany liquid tag jeśli Forem)
- **Cities** — słownik miast wspólny dla meetupów i Matching
- **Persona** — P1 / P2 / P3 (stany usera)

---

## 14. Zmiany względem v2.2 (changelog v2.3 — FINAL)

**Rozstrzygnięte decyzje biznesowe** (sekcja 12 — wszystkie potwierdzone przez founder'a):
- Wygasłe meetupy/profile → zwykłe **404**, BEZ dedykowanego ekranu "wygasło" (wcześniej: 410 + screen)
- Boost post → **brak pre-fillu**, user pisze treść sam (wcześniej: pre-fill zależny od RSVP)
- Rekomendacje → **pool-based** potwierdzone
- URL event-scoped profilu → `/m/{meetup_slug}/{profile_id}` potwierdzone
- Cities seed → **Geonames PL**, próg ≥5000 potwierdzone
- Welcome constraint → **per osoba na zawsze** potwierdzone
- Ban → auto-dezaktywacja profilu potwierdzone
- "Anuluj" w popupie intencji → RSVP zostaje potwierdzone

Sekcja 12 "Biznesowe" przestała być listą pytań — to teraz lista wiążących decyzji.

---

## 15. Zmiany względem v2.1 (changelog v2.2)

**Dodane:**
- **Naming `meetups`** zamiast `events` (kolizja z Forem `Events` module)
- W UI nadal "Wydarzenia" (warstwa prezentacji)
- **Event-scoped Matching profile** — URL `/m/{meetup_slug}/{profile_id}`, E15 zawsze w kontekście konkretnego meetupu z `meetup_note` z tej deklaracji
- **R-Lifecycle** — sekcja 6.5 (24h dla meetupów na listach, 48h dla event-scoped profili, admin widzi wszystko)
- Wygasłe meetupy i event-scoped profile → standardowy 404 (BEZ dedykowanego ekranu)
- Widget meetupu w stanie "zakończone" po wygaśnięciu

**Zmienione:**
- Wszystkie tabele/modele/routy przemianowane: `events` → `meetups`, `event_rsvps` → `meetup_rsvps`, `event_matching_declarations` → `meetup_matching_declarations`, `event_post_widget` → `meetup_post_widget`, `event.id` → `meetup.id`, `event_note` → `meetup_note`, etc.
- URL profilu matcha: `/matching/profile/{id}` → `/m/{meetup_slug}/{profile_id}` (event-scoped)
- Welcome lockout: po `meetup.end_at + 48h` zamiast `+0h` (czyli można wysłać welcome jeszcze 2 dni po meetupie, dopóki event-scoped profil żyje)

**Usunięte:**
- Pojęcie "uniwersalnego" widoku profilu Matching dla obcych (każdy widok jest event-scoped)

---

**Koniec specyfikacji v2.3 (FINAL)**

Konsultuj wątpliwości z Bartkiem przed założeniem implementacyjnym.

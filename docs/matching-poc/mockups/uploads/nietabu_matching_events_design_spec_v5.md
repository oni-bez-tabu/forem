# Specyfikacja UI/UX: POC Matching + Events (nietabu) — v5
## Wersja web — klikalny prototyp

> **Cel dokumentu:** Klikalny prototyp wszystkich user-facing ekranów modułów Events + Matching. Web-first, mobile w fazie 2.
> **Design system:** Używaj istniejącego DS nietabu (kolory, typografia, komponenty bazowe).
> **Język UI:** Polski.

---

## 0. Instrukcja dla Claude Design

1. **Wszystkie ekrany muszą być klikalne** i ze sobą połączone — linki opisane w sekcji "Akcje" każdego ekranu + zbiorczo w sekcji 4 (mapa nawigacji).

2. **Trzymaj się istniejącego design systemu nietabu**. Nie wymyślaj nowych kolorów, typografii. Tam gdzie potrzebny nowy komponent — patrz sekcja 7.

3. **Każdy ekran ma stany**: domyślny (loaded), pusty (empty state), loading. W prototypie pokaż co najmniej domyślny + pusty.

4. **Copy w prototypie ma być dokładnie taka jak w tym dokumencie** (PL). Treść dynamiczna (nazwy eventów, bio matchy) — realistyczne dane.

5. **Świadomie poza zakresem tej iteracji:**
   - Admin panel / CMS
   - Settings Matching (włącznie z dezaktywacją i usuwaniem profilu)
   - Chat — istniejący system nietabu
   - Powiadomienia (push, bell, toasty)
   - **Pełny opis eventu** — link prowadzi do istniejącego posta nietabu (poza scope) albo do zewnętrznej strony

---

## 1. Kontekst produktu

Nietabu to platforma społecznościowa do edukacji i komunikacji seksualnej. Dodajemy dwa nowe moduły:

- **Events** — kalendarz wydarzeń w klubach swing/BDSM/kink/wellness, RSVP dla każdego usera
- **Matching** — opt-in sub-profil pozwalający deklarować intencję na konkretny event i znajdować kompatybilne osoby

**Architektura informacji eventu:**

Każdy event to **nadbudówka z metadanymi** (data, godzina, miejsce, miasto, organizator) + banner. Pełny opis eventu znajduje się **poza eventem** — w jednym z dwóch miejsc:

- **Wewnętrzny post nietabu** — admin tworzy dedykowany post na platformie
- **Zewnętrzna strona** — link do FB eventu, strony klubu, eventbrite itp.

To XOR — admin wybiera jedno z dwóch dla każdego eventu.

**Bannery eventów:**

- Każdy event ma banner (16:9 aspect ratio jako default)
- **Banner uploadowany przez admina** — kluby często mają własne grafiki eventów (FB event banner, Instagram post). Admin może upload'ować ten banner.
- **Banner auto-generated** — jeśli admin nie wgra własnego, system generuje **abstrakcyjny gradient** z akcent color eventu, bez tekstu. (Tekst, jak nazwa eventu, jest dodawany dynamicznie jako overlay w UI — nie wpalany w banner.)
- Auto-gen banner ma być wizualnie konsystentny i ładny — to nie placeholder szary, tylko pełnoprawny element wizualny w stylu DS.

**Framing liczb RSVP — kluczowy:**

Liczniki ("idzie / zainteresowanych") odzwierciedlają **tylko deklaracje z platformy nietabu**, nie wszystkich uczestników eventu (klub ma własne kanały — FB, drzwi, członkostwo). Bez wyraźnego framingu liczby 0-3 wyglądałyby źle dla klubów ("nikt nie idzie na nasz event"). Dlatego **wszędzie** używamy frazy **"z nietabu"** przy licznikach.

Założenia produktowe:
- Profil Matching jest **w pełni odseparowany** od głównego profilu nietabu
- Każdy może RSVP na event bez Matching profilu, ale żeby brać udział w matchingu trzeba założyć osobny profil (3 pola)
- Reveal zdjęcia tylko po mutual filter match
- Każdy może napisać pierwsze — bez swipe / mutual like

---

## 2. Persony do uwzględnienia w prototypie

### P1 — User nietabu BEZ profilu Matching
- Widzi listę eventów, pośredni ekran, może wejść w pełen opis
- Może RSVP
- Widzi banner "Załóż profil Matching" w kilku miejscach
- W liście matchów (po Interested) widzi tylko zbiorczy licznik

### P2 — User nietabu Z profilem Matching, bez deklaracji na dany event
- Pełen dostęp do listy eventów i pośredniego ekranu
- Po RSVP "Idę" dostaje CTA "Zadeklaruj intencję"
- Po RSVP "Interesuje mnie" widzi partial list (statystyki + zamglone karty)
- Może wejść w "Mój profil Matching"

### P3 — User nietabu Z profilem Matching, Z deklaracją na ten konkretny event
- Pełen dostęp do listy matchów (zdjęcia, bio, notatki)
- Może pisać do matchy → trafia do istniejącego czatu nietabu

W prototypie warto zrobić switcher persony (floating button "Przełącz personę").

---

## 3. Ścieżki użytkownika (journey'e)

**J1: Odkrywanie modułu Events (P1)**
Dashboard → menu → "Wydarzenia" → **kalendarium eventów (agenda view)** → klik na event → pośredni ekran → RSVP "Idę"

**J1.5: Czytanie pełnego opisu eventu**
Pośredni ekran → CTA → albo post nietabu (ten sam tab) albo strona zewnętrzna (nowy tab)

**J2: Pierwszy raz w Matching (P1 → P2)**
Pośredni ekran (po RSVP) → banner "Załóż profil Matching" → intro → formularz → success → "Mój profil"

**J3: Deklaracja intencji (P2 → P3)**
Kalendarium → pośredni ekran (RSVP "Idę") → "Zadeklaruj intencję" → formularz → lista matchów

**J4: Znalezienie i napisanie do matcha (P3)**
Lista matchów → klik na kafel → profil matcha → "Napisz" → istniejący chat nietabu

**J5: Widok własnego profilu Matching (P2 lub P3)**
Menu → "Mój profil Matching" → ewentualnie "Edytuj" → formularz → zapis → powrót

W prototypie pokaż minimum **J1 → J4 w naturalnej kolejności**.

---

## 4. Mapa nawigacji

```
[Dashboard nietabu (istniejące)]
        │
        ├── [Wydarzenia: kalendarium]
        │       │
        │       └── [Pośredni ekran eventu]
        │              │
        │              ├── (RSVP buttons)
        │              ├── [Banner: Załóż Matching] ─► [Onboarding intro/formularz/success] ─► [Mój profil]
        │              ├── [CTA: Zadeklaruj intencję] ─► [Formularz deklaracji] ─► [Lista matchów]
        │              ├── [CTA: Zobacz dopasowania] ─► [Lista matchów]
        │              └── [CTA: Zobacz pełen opis]
        │                       │
        │                       ├── (internal) ─► post nietabu (poza scope)
        │                       └── (external) ─► strona zewnętrzna w nowym tabie
        │
        ├── [Lista matchów dla eventu]
        │       └── [Profil matcha]
        │              └── ["Napisz"] ─► istniejący chat nietabu (poza scope)
        │
        └── [Matching: mój profil]
                └── [Edycja profilu Matching]
```

---

## 5. Inwentarz ekranów

| # | Nazwa ekranu | Persona | Priorytet |
|---|---|---|---|
| E1 | Wydarzenia: kalendarium (agenda view) | P1/P2/P3 | Must |
| E2 | Pośredni ekran eventu (bez RSVP) | P1/P2/P3 | Must |
| E3 | Pośredni ekran eventu (po RSVP "Idę") | P1/P2/P3 | Must |
| E4 | Pośredni ekran eventu (po RSVP "Interesuje mnie") | P1/P2/P3 | Must |
| E5 | Onboarding Matching: intro | P1 | Must |
| E6 | Onboarding Matching: formularz | P1 | Must |
| E7 | Onboarding Matching: success | P1 | Must |
| E8 | Mój profil Matching: widok | P2/P3 | Must |
| E9 | Mój profil Matching: edycja | P2/P3 | Must |
| E10 | Deklaracja intencji: formularz | P2 | Must |
| E11 | Lista matchów dla eventu: pełna | P3 | Must |
| E12 | Lista matchów: partial (Interested + Matching, bez deklaracji) | P2 | Must |
| E13 | Lista matchów: ogólny licznik (Interested + bez Matching) | P1 | Must |
| E14 | Lista matchów: empty state | P3 | Must |
| E15 | Profil matcha: widok szczegółowy | P3 | Must |
| E16 | Wydarzenia: empty state | P1/P2/P3 | Should |
| E17 | Wydarzenia: filtry | P1/P2/P3 | Should |

---

## 6. Specyfikacja per-ekran

### E1 — Wydarzenia: kalendarium (agenda view)

**Cel:** Punkt wejścia do modułu Events. Nowoczesne, ogarne kalendarium — nie zwykła lista.

**Filozofia layoutu:**
- **Agenda view, nie calendar grid.** Chronologiczna sekwencja eventów z silnymi sticky day headers.
- **Banner thumbnail po prawej karty** — uploadowany lub auto-gen, daje wizualne życie bez rozrastania karty.
- **Powietrze + hierarchia.** Day headers wyraźnie wybijają się typograficznie, eventy pod nimi mają mniejszą wagę.

**Struktura strony:**
1. **Top bar / header** — tytuł "Wydarzenia", subtytuł, opcjonalny mini-calendar widget do nawigacji po datach
2. **Filter bar** (collapsed by default) — miasto, zakres dat
3. **Banner "Załóż profil Matching"** (dla P1)
4. **Agenda** — vertical list z chunki dni:
   - **Sticky day header**: np. **"PIĄTEK · 14 czerwca"** (uppercase, mocna typografia)
   - Pod headerem 1-N kart eventów (EventCard)
   - Następny day header
   - Itd.
5. Bottom: "Pokaż kolejne wydarzenia"

**EventCard — z banner thumbnail:**

Layout horyzontalny od lewej do prawej:
- **Time block** (anchor po lewej, ~15-20% szerokości):
  - Godzina rozpoczęcia jako duża typografia: **"22:00"**
  - Opcjonalnie godzina końca pod tym, mniejszą czcionką: **"do 04:00"**
- **Content** (środek, najwięcej miejsca):
  - **Nazwa eventu** (H3 / strong)
  - Pod nazwą: **{nazwa lokalu} · {miasto}**
  - Pod tym: **"{n} z nietabu idzie · {m} zainteresowanych"** (subdued)
- **Banner thumbnail** (po prawej, ~80-100px wysokość, ratio 16:9 lub 4:3):
  - Uploadowany banner (jeśli admin wgrał) lub auto-gen gradient (jeśli nie)
- **Right corner / overlay na bannerze**: badge jeśli user RSVP'ował: **"✓ Idziesz"** lub **"✓ Interesuje cię"** (mała pillka)

Karta klikalna w całości. Hover state: subtle accent border / shadow lift.

**Stany:**
- Loaded: agenda z chunki dni, 1-3 eventy na dzień
- Empty (brak nadchodzących): → E16
- Loading: skeleton z 2-3 day headers + dummy cards
- **Single event w day chunk** — wygląda normalnie (1 karta pod headerem)
- **Day bez eventów** — pominięte (nie ma pustych day headers)

**Copy:**
- Tytuł strony: **"Wydarzenia"**
- Subtytuł: **"Sprawdź co się dzieje w polskiej scenie i zadeklaruj swoje zainteresowanie"**
- Banner Matching (P1): **"Chcesz tu kogoś poznać? Załóż profil Matching →"**
- Day header format: **"PIĄTEK · 14 czerwca"** / **"PIĄTEK · 14 czerwca 2027"** (jeśli inny rok)
- Liczniki: **"{n} z nietabu idzie · {m} zainteresowanych"**
- Filtry: "Miasto", "Od daty", "Do daty"
- Bottom CTA: **"Pokaż kolejne wydarzenia"**

**Akcje:**
- Klik karta → E2/E3/E4 (zależnie od RSVP)
- Klik banner → E5
- Filtry → reload kalendarium
- Klik dnia w mini-calendar (jeśli jest) → scroll do dnia w agendzie

**Decyzje designerskie do podjęcia:**
- Czy mini-calendar widget na górze / w sidebarze, czy bez niego?
- Time block po lewej — jak szeroki? (relatywnie do contentu i thumbnaila)
- Banner thumbnail — kwadrat, 16:9, 4:3?

---

### E2 — Pośredni ekran eventu (bez RSVP)

**Cel:** Hub eventu — meta + ficzery Matching. Pełen opis = krok dalej.

**Layout (góra → dół):**
- **Hero banner** (full-width, ratio 16:9 lub 21:9 max):
  - Uploadowany banner od klubu lub auto-gen abstrakcyjny gradient
  - **Overlay z typografią** nakłada się na banner (subtle gradient czarny od dołu, żeby tekst był czytelny):
    - **Data**: np. **"sobota, 14 czerwca 2026"** (display heading)
    - Pod tym **godzina**: **"22:00 - 04:00"**
    - Pod tym **nazwa eventu** (H1, mocne)
    - Pod tym **{nazwa lokalu} · {miasto}**
- **Meta block** (poniżej hero) — organizator
- **CTA primary "Zobacz pełen opis"** — wariant zależny od typu linku (patrz niżej)
- **Sekcja "Wybierz swój udział"** — RSVP buttons
- **Sekcja "Matching na tym wydarzeniu"** — kontent zależny od persony
- **Opcjonalny secondary link "Strona organizatora ↗"** — jeśli admin podał ten link osobno

### CTA "Zobacz pełen opis" — dwa warianty

**Wariant A: Link wewnętrzny (post nietabu)**
- Copy: **"Zobacz pełen opis na nietabu →"**
- Ikona: zwykła strzałka →
- Otwiera się w tej samej karcie
- Brak helper textu

**Wariant B: Link zewnętrzny (strona klubu, FB event, etc.)**
- Copy: **"Zobacz opis u organizatora ↗"**
- Ikona: external arrow ↗
- Otwiera się w nowej karcie (target="_blank")
- Helper text pod CTA (mała czcionka, muted): **"Otworzy się w nowej karcie · {domena, np. heaven-warsaw.pl}"**

> Designer: w prototypie pokaż oba warianty na różnych przykładowych eventach (np. 3 eventy z wariantem A, 3 z wariantem B), żeby tester widział różnicę.

### Sekcja "Wybierz swój udział" — RSVP block

**Default state (bez RSVP):**
- Przyciski: **"Idę"** (primary), **"Interesuje mnie"** (secondary)
- **Helper / framing pod buttonami** (kluczowe):
  - **"{n} z nietabu idzie · {m} zainteresowanych"**
  - Tooltip / micro-copy: **"Liczby dotyczą tylko deklaracji z platformy. Na evencie mogą być też osoby z innych kanałów."**

**Low-count framing (gdy n + m ≤ 2):**
- Zamiast standardowego licznika pokaż:
- **"Bądź pierwszą osobą z nietabu, która zadeklaruje udział na tym wydarzeniu"**

### Sekcja "Matching na tym wydarzeniu" — stany:

- **P1 (bez profilu Matching):**
  - **"Na tym wydarzeniu {N} osób z nietabu szuka kogoś poznać"**
  - **"Załóż profil Matching żeby zobaczyć szczegóły i dołączyć"**
  - CTA: **"Załóż profil Matching"** → E5
  - Low-count alternatywa: **"Bądź pierwszą osobą która zadeklaruje intencję — załóż profil Matching"**

- **P2 (z profilem, RSVP nie kliknięte):**
  - **"Możesz zadeklarować swoją intencję i zobaczyć kogo możesz tu poznać"**
  - CTA: **"Zadeklaruj intencję"** — *disabled* z helper: *"Najpierw zaznacz że idziesz"*

- **P3 (z profilem + deklaracja na ten event):**
  - **"Masz aktywną deklarację: {intent_level}"**
  - CTA: **"Zobacz dopasowania ({N})"** → E11

**Akcje:**
- Klik **Idę** → reload do E3
- Klik **Interesuje mnie** → reload do E4
- CTA "Zobacz pełen opis" → post nietabu (wewn.) lub URL zewn. (nowy tab)
- CTA "Załóż profil Matching" → E5
- CTA "Zadeklaruj intencję" (aktywne tylko po RSVP "Idę") → E10
- CTA "Zobacz dopasowania" → E11

---

### E3 — Pośredni ekran eventu (po RSVP "Idę")

Jak E2, z różnicami:
- RSVP buttons: **"✓ Idziesz"** (active, klik otwiera dropdown z opcją "Anuluj") + **Interesuje mnie** (secondary)
- Inline confirmation: **"Zapisaliśmy że idziesz. Powodzenia 🌙"**
- Sekcja Matching dla P2: CTA "Zadeklaruj intencję" **aktywny**

---

### E4 — Pośredni ekran eventu (po RSVP "Interesuje mnie")

Jak E2, z różnicami:
- RSVP buttons: **Idę** (secondary) + **"✓ Interesuje cię"** (active)
- Sekcja Matching:
  - **P1:** bez zmian (CTA "Załóż profil")
  - **P2:** zamiast CTA "Zadeklaruj" pokaż **partial list inline** (E12 osadzona)
  - **P1 bez profilu (RSVP Interested):** **ogólny licznik inline** (E13 osadzony)

> Decyzja designerska: E12 i E13 mogą być osadzone inline w E4 zamiast osobnych stron. Sugestia: inline.

---

### E5 — Onboarding Matching: intro

**Layout:**
- Hero illustration
- Tytuł, lead
- 3 punkty value props
- Info-box prywatność (wyróżniony)
- CTA primary + link "Może później"

**Copy:**
- Tytuł: **"Poznaj kogoś na wydarzeniu"**
- Lead: **"Matching to osobny profil, który pozwala ci określić kogo chcesz spotkać na konkretnym wydarzeniu — i kto chce spotkać ciebie."**
- Punkty:
  - **"🔒 Pełna prywatność"** — *"Twój profil Matching jest oddzielony od twojego głównego konta nietabu. Nikt nie zobaczy że to ty."*
  - **"📅 Per wydarzenie"** — *"Każdy event = osobna deklaracja. Możesz być inną osobą na różnych imprezach."*
  - **"💬 Bez nacisku"** — *"Zdjęcie zobaczy tylko osoba, która sama szuka kogoś takiego jak ty."*
- Info-box: **"Twoje zdjęcie z profilu Matching pojawia się TYLKO przed osobami, które same szukają kogoś takiego jak ty. Inni go nie zobaczą — nawet w listach. Nikt też nie ma jak skojarzyć profilu Matching z twoim głównym kontem na nietabu."**
- CTA: **"Załóż profil Matching"**
- Link: **"Może później"**

**Akcje:** CTA → E6; "Może później" → powrót

---

### E6 — Onboarding Matching: formularz

**Layout:**
- Tytuł + lead
- 3 pola wertykalnie: zdjęcie, kim jesteś, bio
- CTA primary (disabled dopóki pola wymagane nie wypełnione)

**Copy:**
- Tytuł: **"Twój profil Matching"**
- Lead: **"3 pola. Możesz to zmienić w każdej chwili."**

- **Zdjęcie** (wymagane):
  - Helper: **"Pojawi się tylko przed osobami z którymi masz wzajemne dopasowanie. Nie musi pokazywać twarzy — może być sylwetka, plecy, cokolwiek czujesz że cię reprezentuje."**
  - Placeholder: **"Dodaj zdjęcie"**

- **Kim jesteś?** (wymagane):
  - Opcje: **Kobieta** / **Mężczyzna** / **Para** / **Osoba niebinarna**
  - Helper: **"Możesz to zmienić w każdej chwili. Dla par: zakładacie wspólne konto Matching."**

- **O tobie** (opcjonalne, max 200 znaków):
  - Placeholder: **"Krótko: czego ludzie powinni się o tobie spodziewać"**
  - Counter: **"{N}/200"**
  - Helper: **"To bio jest globalne. Na konkretnym wydarzeniu możesz dodać dodatkowy kontekst."**

- CTA: **"Zapisz profil"**

**Akcje:** Zapisz → E7

---

### E7 — Onboarding Matching: success

**Copy:**
- Tytuł: **"Gotowe ✨"**
- Lead: **"Twój profil Matching jest aktywny. Teraz wybierz wydarzenie i zadeklaruj swoją intencję, żeby zacząć dostawać dopasowania."**
- CTA primary: **"Przejdź do wydarzeń"** → E1
- CTA secondary: **"Zobacz mój profil"** → E8

---

### E8 — Mój profil Matching: widok

**Layout:**
- Karta profilu (taka jaką zobaczy match) — zdjęcie, identity_type, bio
- Sekcja **"Twoje aktywne deklaracje"** — lista nadchodzących eventów z aktywną deklaracją
- CTA "Edytuj profil"

**Copy:**
- Tytuł: **"Twój profil Matching"**
- Podtytuł: **"Tak widzą cię inni (po dopasowaniu)"**
- Sekcja: **"Aktywne deklaracje"**
  - Empty: **"Nie masz aktywnych deklaracji na żadne wydarzenie."** + CTA **"Przeglądaj wydarzenia"**
- Button: **"Edytuj profil"**

**Akcje:**
- Edytuj → E9
- Klik event → E11
- "Przeglądaj wydarzenia" → E1

---

### E9 — Mój profil Matching: edycja

Identyczny layout jak E6, z polami wypełnionymi obecnymi wartościami.

**Copy:**
- Tytuł: **"Edytuj profil Matching"**
- CTA: **"Zapisz zmiany"**, secondary **"Anuluj"**

**Akcje:** Zapisz → E8; Anuluj → E8

---

### E10 — Deklaracja intencji: formularz

**Layout (modal lub sidebar dla web):**
- Header: nazwa eventu + data
- 3 sekcje: intencja, kogo szukasz, notatka
- CTA "Zapisz deklarację" + Anuluj

**Copy:**
- Tytuł: **"Twoja intencja na {nazwa eventu}"**
- Lead: **"Każde wydarzenie to osobna deklaracja. Nikt jej nie zobaczy poza osobami, które pasują do twojego filtra."**

- Sekcja **"Intencja"** — 3 cards:
  - 🌙 **Tylko klimat** — *"Idę, ale nie szukam nikogo. Nie pojawię się w listach dopasowań — będę po prostu na evencie."*
  - 💬 **Otwarty na poznanie** — *"Chętnie kogoś poznam, zobaczymy o czym."*
  - ✨ **Otwarty na chemię** — *"Otwarty na to gdzie to pójdzie."*

- Sekcja **"Kogo szukasz na tym wydarzeniu?"** (multi-select):
  - Chipy: **Kobieta** / **Mężczyzna** / **Para** / **Osoba niebinarna**
  - Helper: *"Wybierz kogo chcesz widzieć w dopasowaniach. Możesz wybrać więcej niż jedną opcję."*
  - Disabled state (gdy just_vibe): *"Wybierz inną intencję, jeśli chcesz dostawać dopasowania."*

- Sekcja **"Notatka na tym wydarzeniu"** (opcjonalna):
  - Placeholder: **"np. 'Pierwszy raz w tym klubie, chętnie pogadam'"**
  - Counter: **"{N}/200"**
  - Helper: *"Pojawi się tylko przed twoimi dopasowaniami z tego wydarzenia."*

- CTA: **"Zapisz deklarację"**, secondary **"Anuluj"**

**Akcje:**
- Zapisz → E11 (jeśli intent != just_vibe) lub E3 (jeśli just_vibe)
- Anuluj → powrót

---

### E11 — Lista matchów dla eventu: pełna

**Layout:**
- Header: nazwa eventu + data + Twoja intencja (badge) + link "Zmień deklarację"
- Filter bar: liczba dopasowań
- Grid kafelków (3 col desktop)

**Karta dopasowania:**
- Zdjęcie
- Identity type (badge)
- Intent level (badge mniej eksponowany)
- Pierwsze ~80 znaków z bio
- Notatka eventowa (wyróżniona, jeśli jest)
- Hover: cała karta klikalna

**Stany:** Loaded / Empty → E14 / Loading skeletons

**Copy:**
- Tytuł: **"Dopasowania na: {nazwa eventu}"**
- Sub: **"{N} osób z nietabu pasuje do twojego filtra"**
- Twoja intencja: **"Twoja intencja: {intent_level} · Szukasz: {identity_types}"**
- Link: **"Zmień deklarację"** → E10

**Akcje:**
- Klik karta → E15
- "Zmień deklarację" → E10 (z pre-fillem)

---

### E12 — Lista matchów: partial (Interested + Matching, bez deklaracji)

**Cel:** User Interested z profilem widzi że COŚ tu jest, ale bez detali. Może być inline w E4.

**Layout:**
- Header: nazwa eventu
- Banner CTA: **"Zadeklaruj intencję żeby zobaczyć kto"**
- Sekcja statystyk:
  - **"Na tym wydarzeniu zadeklarowało się {N} osób z nietabu"**
  - Breakdown identity_types: **"Z tego: {n1} kobiet, {n2} mężczyzn, {n3} par, {n4} osób niebinarnych"**
  - Breakdown intent: **"{n} chce kogoś poznać, {m} otwartych na więcej"**
- Lista "zamglonych" kafelków (placeholder kształty bez zdjęć i bio)

**Copy:**
- Banner CTA: **"Zadeklaruj swoją intencję żeby zobaczyć profile i pisać do dopasowań →"**
- Helper przy zamglonych: *"{N} osób ukrytych do czasu twojej deklaracji"*

**Akcje:**
- Banner → E10
- Klik zamglony kafelek → tooltip "Zadeklaruj intencję żeby zobaczyć"

---

### E13 — Lista matchów: ogólny licznik (Interested + bez Matching)

Może być osadzona inline w E4.

**Layout:** Prosty: jedna karta z licznikiem + CTA.

**Copy:**
- **"{N} osób z nietabu"**
- **"deklaruje że chce kogoś poznać na tym wydarzeniu"**
- Low-count alternatywa: **"Bądź pierwszą osobą która zadeklaruje intencję na tym wydarzeniu"**
- CTA: **"Załóż profil Matching żeby zobaczyć kto"** → E5

---

### E14 — Lista matchów: empty state

**Copy:**
- Ilustracja pustki
- Tytuł: **"Jeszcze nikt nie pasuje do twojego filtra"**
- Lead: **"Bądź pierwszy/a. Twoja deklaracja jest zapisana — gdy ktoś kompatybilny z nietabu się zadeklaruje, dowiesz się."**
- Sub: *"Możesz też zmienić filtr 'Kogo szukasz', żeby zobaczyć więcej osób."*
- CTA: **"Zmień deklarację"** → E10

---

### E15 — Profil matcha: widok szczegółowy

**Layout:**
- Duże zdjęcie (hero)
- Identity type (badge)
- Intent level (badge wyeksponowany)
- Bio (pełne)
- Notatka eventowa (wyróżniona blokowo)
- Kontekst eventu: **"Dopasowanie z: {nazwa eventu} · {data}"** (klikalne → E2/E3)
- Sticky CTA: **"Napisz"**

**Copy:**
- CTA: **"Napisz"** (primary, duży)
- Micro-copy pod CTA: *"Konwersacja zacznie się w twoim chacie. Druga strona widzi tylko twój profil Matching."*

**Akcje:**
- Klik **"Napisz"** → istniejący chat nietabu (designer może zaślepić placeholder screenem)
- Back → E11
- Klik kontekst eventu → E2/E3

---

### E16 — Wydarzenia: empty state

**Copy:**
- Ilustracja
- Tytuł: **"Brak nadchodzących wydarzeń"**
- Lead: **"Pracujemy nad dodawaniem nowych eventów. Wracaj wkrótce!"**
- CTA secondary: **"Jak działa Matching?"** → E5

---

### E17 — Wydarzenia: filtry

Expanding panel nad agendą:
- **Miasto** (multi-select dropdown)
- **Od daty / Do daty** (date range picker)
- Button **"Pokaż wyniki"** + link **"Wyczyść filtry"**

---

## 7. Komponenty potencjalnie nowe w DS

1. **EventCard** — horyzontalny: time block + content + banner thumbnail + RSVP badge
2. **EventBanner** — uploadowany lub auto-gen abstrakcyjny gradient (16:9 default, używany w hero pośredniego ekranu)
3. **EventBannerThumbnail** — mała wersja bannera używana w EventCard (16:9 lub 4:3, ~80-100px wysokość)
4. **AutoGenBannerGradient** — generator gradientu z accent color eventu (parametryzowany), bez tekstu
5. **DayHeader** — sticky uppercase typography "PIĄTEK · 14 czerwca"
6. **HeroOverlay** — overlay z gradientem czarnym od dołu + typografia (data, godzina, nazwa, lokal) nakładana na hero banner
7. **MatchCard** — zdjęcie + badge'e + bio teaser + notatka
8. **MatchCard.muted** — zamglona wersja
9. **IntentBadge** — pill z 3 wariantami (🌙 💬 ✨)
10. **IdentityChip** — multi-select chip
11. **IntentCard** — radio-card używany w E10
12. **EventStatsBlock** — sekcja statystyk dla E12/E13
13. **PrivacyInfoBox** — wyróżniony info block z ikoną kłódki (E5, E6, E10)
14. **ExternalLinkCTA** — wariant primary CTA dla zewnętrznych linków (ikona ↗ + helper text z domeną)
15. **RSVPCountWithFraming** — komponent licznika z frazą "z nietabu" + opcjonalnym low-count framingiem

---

## 8. Stany do pokazania w prototypie

- Pusta lista wydarzeń (E16)
- Pusta lista matchów (E14)
- User w trakcie onboardingu (E5 → E6 → E7)
- Just_vibe declaration → E3 z badge "Twoja intencja: Tylko klimat", bez listy matchów
- Partial list (E12) vs pełna lista (E11) — pokazanie różnicy commitment
- **Eventy z linkiem wewnętrznym vs zewnętrznym** — co najmniej po 2-3 przykłady każdego typu
- **Eventy z uploadowanym bannerem vs auto-gen** — co najmniej po 2-3 przykłady każdego typu (pokazujemy że oba wyglądają dobrze)
- **Low-count state w pośrednim ekranie** — co najmniej 1 event z 0-2 RSVP, z framingiem "Bądź pierwszą osobą"
- **Wysokoobsadzony event** — co najmniej 1 event z 20+ RSVP i 10+ matchami w pool
- **Mix days w agendzie** — co najmniej 5-7 dni z 1-3 eventami każdy, plus 1-2 dni z większą gęstością (3+)

---

## 9. Mikrointerakcje krytyczne

1. **Sticky day headers w agendzie** — przy scrollowaniu day header zostaje na górze ekranu dopóki nie pojawi się następny.

2. **Reveal po deklaracji** — przejście E10 → E11. Krótka animacja + lista pojawia się z fade-in kart.

3. **RSVP toggle** — klik "Idę" → natychmiastowy feedback (button zmienia stan + inline confirmation + licznik update'uje się w czasie rzeczywistym), bez reload strony.

4. **Disabled stany w E10** — gdy intent = just_vibe, pola "kogo szukasz" i "notatka" muszą być wyraźnie wyłączone z helper textem, nie tylko grayed out.

5. **Banner "Załóż profil Matching"** — pojawia się delikatnie po RSVP. Slide-in od dołu lub fade.

6. **CTA "Zobacz pełen opis" — visual differentiation** — wariant external ma wyraźnie inną ikonę (↗) i muted helper text z domeną pod buttonem.

7. **Low-count framing transition** — gdy licznik przekroczy próg (n+m=2), zamiast "Bądź pierwszą osobą" pokazuje się standardowy licznik.

8. **EventCard hover/focus** — accent border / shadow lift. Cała karta klikalna.

9. **Hero banner readability** — overlay gradient od dołu (np. linear-gradient od transparent na górze do rgba(0,0,0,.6) na dole) zawsze nakłada się na banner, niezależnie czy banner jest jasny czy ciemny, czy uploadowany czy auto-gen. To gwarantuje czytelność typografii.

---

## 10. Otwarte pytania designerskie

1. **Mini-calendar widget w E1** — czy potrzebny dla nawigacji, czy bez niego (agenda wystarczy)?
2. **Time block w EventCard** — jak duży? (proporcje względem contentu i thumbnaila)
3. **Banner thumbnail w EventCard** — kwadrat, 16:9, 4:3?
4. **Auto-gen banner — wzór gradientu** — radial, linear, mesh? Bartek lubi raczej minimalistyczny / abstract — niech designer zaproponuje 2-3 warianty.
5. **Accent color dla eventów** — czy admin wybiera z palety DS, czy auto-generated z nazwy?
6. **Hero w E2/E3/E4 — ratio** — 16:9, 21:9, 3:1?
7. **Deklaracja intencji (E10)** — modal czy osobna strona?
8. **E12/E13 — osobna strona czy inline w E4?** (sugeruję inline)
9. **Proporcja zdjęcia w karcie matcha (E11)** — kwadrat, portret, czy 4:5?
10. **Ilustracje empty states** — z istniejącego DS czy nowe?

---

## 11. Out of scope (świadomie nie projektujemy)

- Admin panel / CMS (włącznie z uploadem bannera — to się dzieje w admin panel, nie w user UI)
- Settings Matching (notyfikacje, dezaktywacja, usuwanie profilu)
- Chat — istniejący system nietabu
- Powiadomienia (push, bell, toasty)
- **Pełen opis eventu** — w wariancie wewnętrznym to istniejący post nietabu, w wariancie zewnętrznym to strona klubu
- Verification / weryfikacja wieku
- Login / signup do nietabu — zakładamy że user zalogowany
- Strony statyczne (FAQ, Regulamin) — istniejące

---

**Koniec specyfikacji v5**

W razie wątpliwości projektowych — Bartek (founder nietabu).

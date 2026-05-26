# CLAUDE.md — Moduł Meetups + Matching (POC)

> Ten plik czytasz automatycznie na starcie. Przeczytaj go w całości przed jakąkolwiek pracą nad modułem Meetups/Matching.

## Co to jest

POC dwóch nowych modułów dla nietabu (platforma oparta na Forem):
- **Meetups** — kalendarz wydarzeń + RSVP (w UI po polsku: "Wydarzenia")
- **Matching** — opt-in sub-profil, deklaracja intencji per wydarzenie, kontekstowe dopasowania

## Gdzie co jest

```
/docs/matching-poc/
├── CLAUDE.md        ← ten plik
├── SPEC.md          ← PEŁNA specyfikacja — źródło prawdy funkcjonalne
└── mockups/         ← makiety hi-fi — źródło prawdy wizualne
    ├── README.md
    └── project/hifi/   (index.html = canvas wszystkich ekranów, prototype.html = klikalny)
```

## Zasada nadrzędna: NIE ZACZYNAJ OD KODU

Pierwsze zadanie w tym module to **analiza, nie implementacja**. Konkretnie:

1. Przeczytaj `SPEC.md` w całości + przejrzyj makiety w `mockups/`
2. Wykonaj **sekcję 0 SPEC.md** — przeanalizuj istniejący codebase nietabu pod kątem punktów tam wymienionych (stack, User model, chat, uploady, push, role, system postów / liquid tags, model organizacji, istniejący Forem `Events` module)
3. Zwróć w odpowiedzi TRZY listy:
   - Założenia o istniejącym systemie
   - Decyzje projektowe które proponujesz podjąć
   - Pytania do founder'a (Bartek), których nie da się rozstrzygnąć z kodu ani ze SPEC.md
4. **Zatrzymaj się. Nie pisz kodu.** Czekaj na zatwierdzenie analizy.

## Hierarchia źródeł prawdy

1. `SPEC.md` — wymagania funkcjonalne, logika biznesowa, model danych. Wiążące.
2. `mockups/` — wygląd, layout, UX flow, komponenty, copy. Wiążące wizualnie.
3. **Istniejące repo nietabu** — źródło prawdy dla stylów, design tokenów, konwencji kodu. Z makiet bierzemy *wartości* dla *nowych* komponentów — nie kopiujemy stylów hifi/ jako produkcyjny kod.

Konflikt między SPEC.md a makietami → pytaj, nie zgaduj.

## Krytyczne pułapki (przeczytaj zanim zaczniesz)

- **Naming `meetups`, nie `events`.** Forem ma własny moduł `Events`. Wszystkie nasze tabele/modele/routy/namespace = `meetups`. W UI po polsku "Wydarzenia". Nigdy nie nazywaj naszych bytów `Event`.
- **Chat nietabu jest NIETKNIĘTY.** Welcome message to zwykła wiadomość wstawiana do istniejącego chatu z konta nadawcy. Nie modyfikuj systemu chatu.
- **Decyzje biznesowe są zamknięte** — sekcja 12 SPEC.md to lista wiążących decyzji, nie pytań. Nie pytaj o 404 vs dedykowany ekran, pre-fill boosta, algorytm rekomendacji itd. — to rozstrzygnięte.
- **Profil Matching widziany przez innych jest event-scoped** — URL `/m/{meetup_slug}/{profile_id}`, wygasa 48h po wydarzeniu. Nie ma "uniwersalnego" profilu.
- **R-Lifecycle** (SPEC.md sekcja 6) — meetup znika z list po 24h, event-scoped profil po 48h, admin widzi wszystko. Soft expiration (filtr na endpointach), nie usuwanie z bazy.

## Implementacja: etapami

SPEC.md sekcja 11 dzieli pracę na Etapy 0-6. **Realizuj jeden etap na sesję.** Po każdym etapie: testy, review, commit, dopiero potem następny. Nie próbuj zrobić całego POC w jednym podejściu.

Kolejność: Etap 0 (cities) → 1 (meetups + admin) → 2 (matching profile + chrome) → 3 (deklaracje + matching) → 4 (welcome + boost + widget) → 5 (timeline + push) → 6 (rekomendacje + polish).

## Pierwsza komenda od użytkownika będzie brzmieć mniej więcej

> "Przeczytaj docs/matching-poc/SPEC.md i makiety, wykonaj sekcję 0 — analiza codebase, trzy listy. Nie pisz kodu."

Zastosuj się do tego dosłownie.

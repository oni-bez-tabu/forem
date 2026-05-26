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

## Następny etap

**Etap 1 — Meetups fundament + admin** (SPEC.md §11)

Zakres:
- Migracje `meetups`, `meetup_rsvps`
- Picker organizatora (`organizer_user_id` XOR `organizer_organization_id`, wzorzec z Forem `Event`)
- API CRUD meetups + RSVP endpoints
- Lifecycle filters w endpointach publicznych (24h dla list meetupów)
- Admin panel: CRUD meetupów + upload bannera + statystyki
- Frontend user: E1 (lista) + E2 (hub) + RSVP popup P1 + share popup z "Skopiuj link"
- Wygasłe meetupy → standardowy 404
- Acceptance: admin dodaje meetup → user RSVP'uje → kopiowanie linku → po 24h od `end_at` meetup znika z list

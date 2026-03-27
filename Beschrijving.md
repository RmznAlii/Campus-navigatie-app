# Code Uitleg

## Overzicht

De app bestaat uit:
- HTML voor structuur
- CSS voor styling
- JavaScript voor logica
- JSON voor lokaaldata

Belangrijkste bestanden:
- `index.html`
- `kaart.html`
- `route.html`
- `route-detail.html`
- `info.html`
- `lokaal-zoeken.html`
- `data/locaties.json`

Scripts per pagina staan in:
- `js/pages/index.js`
- `js/pages/kaart.js`
- `js/pages/route.js`
- `js/pages/route-detail.js`
- `js/pages/lokaal-zoeken.js`

---

## Pagina's en code

## 1) Home
Bestanden:
- `index.html`
- `js/pages/index.js`

Wat de code doet:
- Leest de invoer uit de zoekvelden.
- Stuurt door naar de juiste pagina met query parameter `q`.
- Zoek lokaal -> `route-detail.html?q=...`
- Campus kaart -> `kaart.html?q=...`

---

## 2) Kaart
Bestanden:
- `kaart.html`
- `js/pages/kaart.js`
- `css/kaart.css`

Wat de code doet:
- Laadt lokaaldata uit `data/locaties.json`.
- Zoekt op lokaalnaam (exact en gedeeltelijk).
- Zet marker op de kaart met coordinaten.
- Toont popup bij marker met knop `Start route`.
- Stuurt door naar `route-detail.html?q=...`.
- Ondersteunt pannen/slepen op de kaart.
- Beheert filters (gebouw/verdieping).
- Slaat recente zoekopdrachten op in `localStorage` (key: `recentRoutes`).

Extra logica:
- Voor `AC1` worden coordinaten omgerekend naar `AC1_NIEUW` zodat markers op de juiste plek staan.

---

## 3) Route overzicht
Bestanden:
- `route.html`
- `js/pages/route.js`
- `css/route.css`

Wat de code doet:
- Leest `recentRoutes` uit `localStorage`.
- Toont lijst met recent gezochte lokalen.
- Knop `Route` opent `route-detail.html?q=...`.
- Zoekveld op deze pagina doet hetzelfde.

---

## 4) Route detail
Bestanden:
- `route-detail.html`
- `js/pages/route-detail.js`
- `css/route-detail.css`

Wat de code doet:
- Leest lokaalnaam uit URL (`q`).
- Zoekt lokaal in `data/locaties.json`.
- Laadt juiste kaartafbeelding op basis van gebouw.
- Zet startmarker en eindmarker.
- Tekent route-lijn tussen begin en eind.
- Toont route-info (start, looptijd, verdieping, aankomst).

---

## 5) Info
Bestanden:
- `info.html`
- `css/info.css`

Wat de code doet:
- Toont statische gebouwinformatie in het gekozen design.
- Heeft eigen header en eigen navbar-kleuren.
- Deze pagina gebruikt geen aparte JavaScript-logica.

---

## 6) Lokaal zoeken
Bestanden:
- `lokaal-zoeken.html`
- `js/pages/lokaal-zoeken.js`

Wat de code doet:
- Leest query `q` uit de URL.
- Filtert lokalen uit `data/locaties.json`.
- Toont geen, één of meerdere resultaten.

---

## Styling

Algemeen:
- `css/style.css` bevat basislayout, algemene componenten en standaard navbar.

Per pagina:
- `css/kaart.css` voor kaartpagina
- `css/route.css` voor route-overzicht
- `css/route-detail.css` voor route-detail
- `css/info.css` voor info-pagina

Elke pagina heeft dus eigen thema, maar gebruikt dezelfde basiscomponenten.

---

## Data

Bestand:
- `data/locaties.json`

Inhoud:
- lokaalnaam
- beschrijving
- coordinaten
- gebouw/verdieping structuur

Deze data wordt gebruikt door kaart, route-detail en lokaal-zoeken.

---

## Korte flow

1. Gebruiker voert lokaal in.
2. App leest data uit `locaties.json`.
3. App navigeert naar kaart of route-detail.
4. Marker/route wordt getoond.
5. Zoekopdracht komt in `recentRoutes`.

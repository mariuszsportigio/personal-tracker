# Personal OS — tracker

Prywatna PWA (single user): **MIT dnia + 3 poboczne taski + zamknięcie dnia ze spowiedzią**,
**nawyki** ze streakami oraz **spend tracker** (zakupy ze splitem podkategorii, miasto,
subskrypcje, zrzutki/przelewy z tagiem „wyjazdy", zwroty) ze statami miesięcznymi.

**Live: https://mariuszsportigio.github.io/personal-tracker/**

Fork techniczny apki [drink-responsible](https://github.com/mariuszsportigio/drink-responsible)
(ten sam stack: Vite + React + TS + Tailwind 4 + PWA injectManifest). UI po polsku, kod po
angielsku, dane wyłącznie w `localStorage` (klucz `personal-tracker/v1`).

```bash
npm install
npm run dev        # http://localhost:5174/personal-tracker/
npm run build      # tsc + vite + service worker → dist/
npm run icons      # regeneracja ikon PWA (fioletowe — odróżnienie od drink-apki)
```

## Moduły

- **Dziś**: jeden MIT (blokowany jako zobowiązanie) + max 3 poboczne taski; wieczorem
  „Zamknij dzień" → spowiedź: przegląd MIT/tasków/nawyków, ocena dnia 1–10, notka; streak domkniętych dni.
- **Nawyki**: checklista dzienna, siatka ostatnich 7 dni, streaki.
- **Wydatki**: kafle kategorii (Zakupy: Biedronka/Lidl/Żabka…, Miasto: restauracja/bar…,
  Transport, Przelew/Zrzutka: prezent/wyjazd/hotel, Inne). Kwota + opcjonalny zwrot („oddane"),
  tag 🧳 wyjazdy (auto przy wyjazd/hotel), a przy zakupach **split suwakami** na podkategorie:
  żywność daily / gotowce / środki czystości / long-term (kawa, mąka, olej). Subskrypcje jako
  osobna lista (nazwa, kwota/mies., aktywna).
- **Staty**: nawigacja miesiącami, netto po zwrotach, śr./dzień, wyjazdy, subskrypcje,
  pie per kategoria, dzienne słupki, breakdown splitu zakupów, kalendarz domkniętych dni.

## Deploy

Automatyczny: push na `main` → workflow `deploy.yml` → GitHub Pages
([repo](https://github.com/mariuszsportigio/personal-tracker)). Ręcznie: `gh workflow run deploy.yml`.

Na telefonie: otwórz link → „Dodaj do ekranu głównego". Dane (w tym wydatki) zostają wyłącznie
w `localStorage` na urządzeniu — backup przez eksport JSON w zakładce Staty.

# Analiza trenutnog index.html i plan rada (v1)

Datum: 2025-08-08
Status: U toku — Koraci 1–4 završeni (encoding, A11y minimal, CSS konsolidacija, lightbox + sync sadržaja)

## 1) Trenutno stanje (snapshot)
- Struktura:
  - Glavne sekcije: finansije, smeštaj, prevoz, raspored, plaže, restorani, aktivnosti, nerešeno, kontakti, pakovanje, podsetnici.
  - Akordeoni: main (sekcije) i pod-akordeoni (npr. autobus/iznajmljivanje/taxi).
- JS:
  - toggleMainAccordion, toggleAccordion, toggleTaxiList, openLightbox/closeLightbox, renderAgnontas + data, updateDaysLeft.
  - Funkcionalno: radi otvaranje/zatvaranje; nema aria-updejta (nije a11y).
- CSS:
  - Dobar responsive, više media querija, print stilovi, kartice, timeline.
  - Duplirana definicija .table-responsive (dvije varijante).
- Slike i iframes:
  - Header slike koriste window.open (ne lightbox).
  - Većina iframes ima loading="lazy" (provjera kasnije da je baš 100%).
- Navigacija:
  - Quick-nav postoji (nije sticky).
  - “Back to top” dugme postoji.
- ID-jevi:
  - Sekcijski ID-jevi djeluju jedinstveno (finansije, smestaj, …).

## 2) Uočeni problemi
1) Enkodiranje/emoji artefakti (mojibake)
   - Primjeri:
     - Finansije naslov: “ 💰 Finansijski pregled (zaštićeno)”
     - Taxi naslov: “ 🚖 Opcija 3: Taxi…”
     - Taxi podnaslov: “ 📄 Oficijelni cjenovnik…”
   - Uzrok: kopija iz izvora s različitim encodingom; rješenje: zamjena karaktera.

2) A11y i semantika akordeona
   - Headeri su div + onclick.
   - Nema aria-expanded/aria-controls; nema tastaturne podrške.

3) CSS duplikati
   - .table-responsive definisana dva puta s različitim margin/padding vrijednostima.

4) Lightbox dosljednost
   - Header slike i pojedini thumbnaili koriste window.open umjesto openLightbox.

5) Performanse (manje)
   - Provjeriti da SVI <iframe> imaju loading="lazy".
   - Razmotriti “click-to-load” za karte (opcionalno).

6) Validnost (nice-to-have)
   - Kada pređemo na <button> u headerima, voditi računa o HTML validnosti (bolje h2 > button nego h2 unutar button-a).

## 3) Predloženi plan (iterativno, bez vizuelnih regresija)

Korak 1 — Enkodiranje/emoji cleanup (bez vizuelnih promjena)
- Zamijeniti “ ” artefakte čistim emoji/tekstom.
  - “ 💰 Finansijski pregled (zaštićeno)” → “💰 Finansijski pregled (zaštićeno)”
  - “ 🚖 Opcija 3: Taxi…” → “🚖 Opcija 3: Taxi…”
  - “ 📄 Oficijelni cjenovnik…” → “📄 Oficijelni cjenovnik…”
- Sačuvati fajl kao UTF-8 (bez BOM).
- Test: vizuelno očišćeni naslovi, bez lomova.

Korak 2 — A11y minimal (bez refaktora layouta)
- Zadržati postojeće div headere, ali:
  - Dodati role="button" i tabindex="0".
  - U JS: na otvoranje/zatvaranje postavljati aria-expanded="true/false" na header.
  - Dodati keydown handler (Enter/Space) za toggle.
- Test: Tab fokus, Enter/Space otvaraju; screen reader čita stanje.

Korak 3 — CSS konsolidacija (.table-responsive)
- Ukloniti duplirani skup pravila i ostaviti jednu “kanonsku” definiciju.
- Test: tabele i dalje skrolabilne na mobilnom; bez horizontalnog overflow-a.

Korak 4 — Lightbox dosljednost
- Header slike: zamijeniti window.open(this.src) sa openLightbox(this.src).
- Test: sve slike koje treba otvaraju se u lightbox-u, ESC/dugme zatvara.

Korak 5 — Performanse (quick pass)
- Osigurati loading="lazy" na svim iframes.
- (Opcionalno) Click-to-load mape: placeholder + učitavati <iframe> tek na klik.
- Test: mrežni log pokazuje manje inicijalnih učitavanja.

Korak 6 — A11y full (opciono, ako želiš najbolje prakse)
- Zamijeniti div headere sa <button> + aria-controls/aria-expanded.
- Panelima dodati id + aria-labelledby.
- Test: bez vizuelnih promjena, validan HTML.

Korak 7 — Nice-to-have
- Sticky quick-nav (desktop).
- Sitne UX dorade (nema promjene sadržaja).

## 4) Kontrolna lista testova
- Tastatura: Tab → fokus na header; Enter/Space togglaju; aria-expanded mijenja stanje.
- Mobile: bez horizontalnog scroll-a; tabele skrolabilne.
- Lightbox: otvaranje/zatvaranje, fokus ne “bježi”.
- Iframes: svi lazy; stranica brže učitava.
- ID-jevi: jedinstveni (nema duplikata).
- Print: nema ugnježdenih rezova timeline-a (break-inside: avoid radi).

## 5) Pretrage/regex pomoć (u VS Code)
- Naći artefakte enkodiranja:
  - Traži: ``
- Provjeriti iframe bez lazy:
  - Regex: `<iframe(?![^>]*loading=)`
- Naći sve .table-responsive definicije:
  - Traži: `.table-responsive {`
- Naći header slike sa window.open:
  - Traži: `window.open(`

## 6) Predlog granula (pull-requests po koraku)
- PR-1: Encoding cleanup (naslovi + UTF-8 save).
- PR-2: A11y minimal (role/tabindex/aria + JS update).
- PR-3: CSS konsolidacija.
- PR-4: Lightbox usklađivanje.
- PR-5: Iframe lazy audit.
- PR-6: A11y full (opciono) + sticky nav (opciono).

---

## 7) Dodatne smjernice i provjere (dopuna)
- Brzi nalazi iz skeniranja trenutnog index.html:
  - Pojave “�” u naslovima: 3 mjesta (finansije, taxi naslov, taxi podnaslov).
  - window.open na slikama: 3 mjesta (header i još 2 thumbnaila).
- Sigurnost linkova:
  - Za sve `target="_blank"` dodati `rel="noopener noreferrer"` (u Korak 4 zajedno sa lightbox doradom; ne mijenja izgled).
- A11y dopune (uz Korak 2/6):
  - Panelima dodati `role="region"` i `aria-labelledby` (mapirati na header id).
  - Dekorativnim ikonama (emoji/span) dodati `aria-hidden="true"` ili tekstualne alternative.
  - Sve slike provjeriti da imaju smislen `alt` tekst.
- Lightbox UX:
  - Kada je otvoren, zabraniti skrol tijela (npr. `document.body.style.overflow = 'hidden'` i vratiti pri zatvaranju).
  - Podržati zatvaranje na Escape; vratiti fokus na element koji je otvorio lightbox.
- JS organizacija (kasnije, opciono):
  - Ukloniti inline `onclick` i preći na `addEventListener` (bez vizuelnih promjena, ali čišći kod).
- Print pregled:
  - Provjeriti da kartice/timeline ne prelome nespretno; koristiti `break-inside: avoid` gdje treba.

## 8) Pauza poslije svakog koraka (dogovor)
- Nakon svake izmjene:
  1) Sačuvati `index.html`.
  2) Vizuelno provjeriti stranice (desktop + mobilni viewport, npr. 375px).
  3) Označiti checkbox u ovom dokumentu i preći na naredni korak tek nakon potvrde.

## 9) Backup strategija (prije svake izmjene)
- Napraviti kopiju: `index_backup_YYYYMMDD_HHMM.html` u root ili u `backups/`.
- Alternativa: ručno `index.html` → `index_stepN_before.html` za svaki korak.

## 10) Kriterijumi prihvatanja po koraku
- Korak 1: Nigdje se ne pojavljuje “�”; naslovi sa emoji su čitki; fajl sačuvan kao UTF-8.
- Korak 2: Headeri fokusibilni tastaturom; Enter/Space rade; aria-expanded ispravno se ažurira.
- Korak 3: Samo jedna `.table-responsive` definicija; bez horizontalnog scroll-a.
- Korak 4: Sve relevantne slike otvaraju u lightbox-u; nema `window.open`; `target="_blank"` linkovi imaju `rel`.
- Korak 5: Svi `<iframe>` imaju `loading="lazy"`; inicijalno učitavanje brže (osjećaj ili mrežni log).
- Korak 6: Semantički ispravan akordeon (button + ARIA) bez vizuelnih promjena.

---
Stanje: ažurirano nakon sinhronizacije Urban Touch i eSIM — označeno kao završeno.

## Sljedeći mali koraci (kratko)
- Proći kroz sve <iframe> i potvrditi da svi imaju loading="lazy" i (gdje treba) referrerpolicy.
- Brza provjera da nijedna slika više ne koristi window.open (sve u openLightbox).
- Opciono: click-to-load za mape (placeholder → učitaj iframe na klik) — ako želiš dodatno ubrzanje.

Napomena: Ako dodaš još neki smještaj ili mijenjaš datume, treba sinhronizovati 3 mjesta: Smeštaj kartice, Raspored Dan X blok, i Finansije (tabele + ukupno).
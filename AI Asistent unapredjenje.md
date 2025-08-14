Odličan trenutak da "AI asistent" dignemo na sljedeći nivo. Evo kako bih ja to riješio: odvojimo ga iz glavnog HTML-a u male, jasne module (JS + JSON), damo mu "mode" razmišljanja (scenarije dana), i neka iz tih scenarija sam slaže dnevni plan: polazak iz smještaja → prevoz → aktivnost(e) → večera → povratak, uz linkove na mape i okvir troška.

# 🧠 AI Asistent - Unapređena Verzija 2.0

## 🎯 Vizija: Od Osnovnog Generatora do Pametnog Planera

Trenutni A---

# 5) Šta dalje (PROŠIRENI PLAN - implementacija poboljšanja)

## 🔧 Korak po Korak Implementacija

### **FAZA 1: Osnovna Modularnost** 
- ✅ Kreiranje folder strukture (assistant/, data/)
- ✅ Osnovni HTML blok sa 4 scenarija
- ✅ Bazni assistant.js sa planBeachDinner, planIslandLoop, planMix, planBadWeather
- ✅ JSON fajlovi sa osnovnim podacima

### **FAZA 2: Napredni Scenariji**
```javascript
// Dodati u assistant.js
function planRomantic(base, sea) {
    const sunsetBeach = places.beaches.find(b => b.sunset) || places.beaches[0];
    const romanticRestaurant = restaurants.find(r => r.romantic) || restaurants[0];
    return {
        title: '💕 Romantični dan',
        items: [
            {time:'11:00', what:`Polazak ka skrivenom ${sunsetBeach.name}`, link: gm(sunsetBeach.gmaps)},
            {time:'11:30–16:00', what:`Privatno sunčanje i kupanje`},
            {time:'18:30', what:`Romantična večera u ${romanticRestaurant.name}`, link: gm(romanticRestaurant.gmaps)},
            {time:'20:30', what:`Zalazak sunca sa čašom vina`},
        ],
        tips: ['💕 Ponesiti vino i ćebe za zalazak', '📸 Savršeno za fotografije']
    };
}

function planActive(base, sea) {
    const activeBeach = places.beaches.find(b => b.watersports) || places.beaches[0];
    const activity = pickRandom(activities.filter(a => a.category === 'active'));
    return {
        title: '🏃 Aktivni dan',
        items: [
            {time:'08:30', what:`Jutarnja šetnja/trčanje pored mora`},
            {time:'10:00', what:`${activity.name} na ${activeBeach.name}`, link: gm(activeBeach.gmaps)},
            {time:'15:00', what:`Snorkeling ili SUP`},
        ],
        tips: [`🏃 Ponesiti sportsku opremu`, `💧 Puno vode i snekova`]
    };
}
```

### **FAZA 3: Pametni Transport Algoritam**
```javascript
function smartTransportChoice(from, to, distance, time, weather) {
    // Kratke rute + dobro vreme = bus
    if (distance < 15 && weather !== 'windy' && time !== 'late') {
        return { type: 'bus', reason: 'Kratka ruta, idealno za bus' };
    }
    // Više destinacija = rent
    if (to.includes('multiple')) {
        return { type: 'rent', reason: 'Više lokacija, rent je efikasniji' };
    }
    // Kasno vreme ili loše vreme = taxi
    if (time === 'late' || weather === 'windy') {
        return { type: 'taxi', reason: 'Brže i sigurnije u ovim uslovima' };
    }
    return { type: 'bus', reason: 'Optimalan izbor' };
}
```

### **FAZA 4: Budžet Kalkulator**
```javascript
function calculateBudget(plan, transportType) {
    let total = 0;
    let breakdown = [];

    // Transport troškovi
    if (transportType === 'bus') {
        total += 8; breakdown.push('Transport (bus): €8');
    } else if (transportType === 'taxi') {
        total += 50; breakdown.push('Transport (taxi): €50');
    } else if (transportType === 'rent') {
        total += 30; breakdown.push('Transport (rent): €30');
    }

    // Hrana (aproksimacija)
    total += 45; breakdown.push('Hrana i piće: €45');

    // Aktivnosti
    if (plan.activities && plan.activities.length > 0) {
        total += 20; breakdown.push('Aktivnosti: €20');
    }

    return { total, breakdown };
}
```

### **FAZA 5: Favoriti Sistem**
```javascript
// /assistant/favorites.js
function saveFavorite(plan) {
    const favorites = JSON.parse(localStorage.getItem('aiPlanFavorites') || '[]');
    const favorite = {
        id: Date.now(),
        name: plan.title,
        plan: plan,
        saved: new Date().toLocaleDateString('sr-RS')
    };
    favorites.push(favorite);
    localStorage.setItem('aiPlanFavorites', JSON.stringify(favorites));
    alert(`💾 Plan "${plan.title}" je sačuvan u favorite!`);
}

function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('aiPlanFavorites') || '[]');
    if (favorites.length === 0) {
        alert('📝 Nemate sačuvane favorite.');
        return;
    }
    
    const choice = prompt(`📋 Izaberite favorit:\n${
        favorites.map((f, i) => `${i+1}. ${f.name} (${f.saved})`).join('\n')
    }`);
    
    const index = parseInt(choice) - 1;
    if (index >= 0 && index < favorites.length) {
        render(favorites[index].plan);
    }
}
```

## 📊 Prošireni JSON Fajlovi

### **data/places.json (sa dodatnim atributima)**
```json
{
  "bases": {
    "pineTrees": {
      "name": "The Pine Trees",
      "label": "The Pine Trees — Agnontas",
      "coords": [23.7089, 39.0831]
    }
  },
  "beaches": [
    {
      "id": "panormos",
      "name": "Panormos Beach", 
      "area": "Panormos",
      "distance": 15,
      "sheltered": false,
      "sunset": true,
      "watersports": true,
      "tags": ["organized", "snorkel", "family"],
      "busAccessible": true,
      "difficulty": "easy",
      "bestFor": ["swimming", "snorkeling"],
      "gmaps": "https://maps.google.com/?q=Panormos+Beach+Skopelos"
    }
  ]
}
```

### **data/restaurants.json (sa dodatnim atributima)**
```json
[
  {
    "id": "korali",
    "name": "Korali Seafood Restaurant",
    "area": "Agnontas",
    "romantic": true,
    "cozy": false,
    "priceRange": "€€",
    "speciality": "seafood",
    "openLate": false,
    "beachfront": true,
    "gmaps": "https://maps.google.com/?q=Korali+Seafood+Restaurant+Skopelos"
  }
]
```

### **data/activities.json (novo)**
```json
[
  {
    "id": "sup",
    "name": "Stand Up Paddling",
    "category": "active",
    "duration": 120,
    "price": 25,
    "location": "Panormos",
    "weatherDependent": true,
    "difficulty": "easy"
  },
  {
    "id": "hiking",
    "name": "Planinarenje do vidikovca",
    "category": "active",
    "duration": 240,
    "price": 0,
    "location": "Glossa",
    "weatherDependent": false,
    "difficulty": "medium"
  }
]
```

## 🎨 Prošireni HTML sa Favoritima

```html
<section id="ai-assistant" class="info-card" style="border-left:5px solid #673ab7; background: #f3e5f5;">
  <h3 style="margin-bottom:12px; color: #673ab7;">🤖 Aleksandrov Prijedlog za Dan</h3>
  
  <form id="ai-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:15px;">
    <!-- Postojeći selectovi + dodati novi scenariji -->
    <label>
      <strong>🧭 Željeni tip dana</strong>
      <select name="dayMode" id="dayMode">
        <option value="beachDinner">🏖️ Morski dan + večera</option>
        <option value="islandLoop">🗺️ Obilazak ostrva (avantura)</option>
        <option value="mix">🏛️ Mix: plaža + grad</option>
        <option value="romantic">💕 Romantični dan</option>
        <option value="active">🏃 Aktivni dan</option>
        <option value="badWeather">☔ Plan B (loše vreme)</option>
      </select>
    </label>

    <button type="button" id="generatePlan" class="gemini-btn" style="grid-column:1/-1;">
      📅 Generiši plan za danas
    </button>
  </form>

  <!-- Favoriti dugmad -->
  <div id="favorites-section" style="margin-top:15px; display:none;">
    <button id="saveFavorite" class="btn-secondary">⭐ Sačuvaj kao favorit</button>
    <button id="loadFavorites" class="btn-secondary">📋 Učitaj favorit</button>
    <button id="exportPlan" class="btn-secondary">📤 Export (PDF/WhatsApp)</button>
  </div>

  <div id="ai-output" style="margin-top:20px;">
    <p style="text-align:center; color:#666;">Izaberite opcije i generišite vaš personalizovani plan!</p>
  </div>
</section>
```

## 🚀 Export i Sharing Funkcije

```javascript
function exportToPDF(plan) {
    // Generiše lepo formatiran PDF plan
    const printContent = `
        <h2>${plan.title}</h2>
        <table>
            ${plan.items.map(i => `<tr><td>${i.time}</td><td>${i.what}</td></tr>`).join('')}
        </table>
        <p>Transport: ${plan.transportNote}</p>
        <p>Budžet: ${plan.estCostNote}</p>
    `;
    
    const newWin = window.open('', '_blank');
    newWin.document.write(printContent);
    newWin.print();
}

function shareToWhatsApp(plan) {
    const text = `${plan.title}\n\n${
        plan.items.map(i => `${i.time} - ${i.what}`).join('\n')
    }\n\n${plan.transportNote}\n${plan.estCostNote}`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}
```

## 📱 Progressive Web App opcije

```json
// manifest.json
{
  "name": "Skopelos Plan Asistent",
  "short_name": "Skopelos AI",
  "description": "Pametni asistent za planiranje dana na Skopelosu",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#4facfe",
  "theme_color": "#4facfe",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🎯 Finalni Rezultat

Nova verzija AI asistenta će biti:

1. **🧠 Izuzetno Pametan**: 6 scenarija + pametni transport algoritam
2. **🎨 Potpuno Personalizovan**: Sve opcije prilagođene korisniku  
3. **💰 Transparentan**: Detaljne budžet kalkulacije
4. **⭐ Praktičan**: Favoriti, export, sharing funkcije
5. **📱 Moderan**: PWA ready, responsive, offline capable
6. **🔧 Lako Održiv**: Modularna arhitektura za buduće proširivanje

**Sledeći korak**: Implementacija faza po faza! 🚀

---

# 6) Prioriteti za Implementaciju

1. **PRVO**: Osnovni modularni sistem (assistant.js + JSON fajlovi)
2. **DRUGO**: Dodatna 2 scenarija (Romantic, Active) 
3. **TREĆE**: Favoriti sistem
4. **ČETVRTO**: Budžet kalkulator i pametni transport
5. **PETO**: Export funkcije i PWA optimizacija

Ovaj plan omogućava postupnu implementaciju - možemo krenuti sa osnovom i dodavati funkcionalnosti jedna po jedna! 💪nt generiše generičke predloge. Nova verzija će biti **modularan, pametan i potpuno personalizovan** sistem za planiranje dana na Skopelosu.

## 🚀 Ključne Prednosti Nove Verzije

### 1. **Modularnost & Organizacija**
- **Čistiji kod**: Logika odvojena u `assistant.js`, stilovi u `assistant.css`
- **Lako održavanje**: Svi podaci u JSON fajlovima, izmene bez diranja koda
- **Skalabilnost**: Dodavanje novih plaža/restorana je trivijalno

### 2. **Scenarijski Pristup (6 Načina Razmišljanja)**
Umesto jednog opšteg prompt-a, imamo specifične scenarije:

- 🏖️ **Beach + Dinner**: Morski dan sa večerom blizu plaže
- 🗺️ **Island Loop**: Obilazak ostrva (avantura)
- 🏛️ **Mix Day**: Kombinacija plaža + grad
- ☔ **Plan B**: Rešenja za loše vreme
- 💕 **Romantic**: Romantični dan (skrivene plaže, sunset points)
- 🏃 **Active**: Aktivni dan (planinarenje, vodni sportovi)

### 3. **Personalizacija & Pametni Izbori**
- **Polazna lokacija**: Pine Trees, Ktima tis Matinas, Chora, GPS
- **Tip prevoza**: Pametni algoritam bira optimalno rešenje
- **Uslovi mora**: Prilagođava predloge vremenu i vetru
- **Budžet kalkulator**: Automatski računa troškove
- **Favoriti sistem**: Čuvanje omiljenih planova

### 4. **Napredne Funkcionalnosti**
- **Pametni transport**: Algoritam za optimalan izbor prevoza
- **Real-time adaptacija**: Prilagođava se vremenu i uslovima
- **Export opcije**: PDF, WhatsApp sharing, clipboard
- **Offline mode**: Osnovne funkcije bez interneta
- **Progress tracking**: Istorija korišćenih planova

## 📁 Optimalna Struktura Projekta

```
/
├── index.html                 (glavni fajl sa novim HTML blokom)
├── assistant/
│   ├── assistant.js          (glavna logika)
│   ├── assistant.css         (stilovi)
│   ├── assistant-utils.js    (helper funkcije)
│   └── favorites.js          (favoriti sistem)
├── data/
│   ├── places.json           (plaže, znamenitosti)
│   ├── restaurants.json      (svi restorani)
│   ├── transport.json        (bus cene, rute)
│   ├── taxi.json            (taxi cenovnik)
│   ├── activities.json       (aktivnosti, sportovi)
│   └── weather-tips.json     (saveti za loše vreme)
└── assets/                   (postojeći sadržaj)
```

# Plan (detaljno sa poboljšanjima)

1. **Izdvoj strukturu**

* `/assistant/assistant.js` – logika i generisanje plana
* `/assistant/assistant.css` – sitni stilovi bloka asistenta
* `/assistant/favorites.js` – favoriti sistem i export funkcije
* `/data/places.json`, `/data/transport.json`, `/data/taxi.json`, `/data/restaurants.json`, `/data/activities.json` – podatci koje lako mijenjaš bez diranja koda
* U `index.html` ostaje samo **mali HTML blok** + `<script src="./assistant/assistant.js">`

2. **State & preference** (čuva u `localStorage`)

* `homeBase` (npr. "Pine Trees – Agnontas", ili Auto (GPS))
* `preferredTransport` (Bus / Rent / Taxi / Smart - kombinuj)
* `dayMode` (scenarij: Beach+Dinner, Island loop, Mix, Bad weather, Romantic, Active)
* `budgetGuard` (prikaži procjenu troška dana)
* `seaConditions` (mirno/vjetrovito/loše)
* `userFavorites` (sačuvani planovi)

3. **"Mode" scenariji (prošireni)**

* **A) Beach + Dinner Nearby**: jutarnji bus/taxi do plaže → chill/snorkel → taverna 5–10 min pješke → povratak
* **B) Island Loop (avantura)**: Agios Ioannis → Kastani/Milia → panorama + večera u Chori
* **C) Mix**: pola dana plaža → kasno popodne Skopelos Town (muzej + rooftop/Perivoli)
* **D) Plan B (vjetar/kiša)**: muzeji, kafići, Glossa/Loutraki vidikovci, food-tour
* **E) Romantic**: skrivene plaže, sunset points, intimni restorani, šetnje
* **F) Active**: planinarenje, SUP, kajak, snorkeling, bicikliranje

4. **Automatika u pozadini (poboljšana)**

* **Pametni transport algoritam**: Kratke rute + dobro vreme = bus; više destinacija = rent; kasno/loše vreme = taxi
* **Budžet kalkulator**: Automatski sabira prevoz + hranu + aktivnosti + tips
* **Favoriti sistem**: Čuva najbolje planove, brzo učitavanje
* **Weather adaptation**: Prilagođava izbor plaža i aktivnosti
* **GPS integracija**: Auto-detektuje polaznu lokaciju (uz dozvolu)
* **Export funkcije**: PDF, WhatsApp, clipboard, email sharingičan trenutak da “AI asistent” dignemo na sljedeći nivo. Evo kako bih ja to riješio: odvojimo ga iz glavnog HTML-a u male, jasne module (JS + JSON), damo mu “mode” razmišljanja (scenarije dana), i neka iz tih scenarija sam slaže dnevni plan: polazak iz smještaja → prevoz → aktivnost(e) → večera → povratak, uz linkove na mape i okvir troška.

# Plan (kratko)

1. **Izdvoj strukturu**

* `/assistant/assistant.js` – logika i generisanje plana
* `/assistant/assistant.css` – sitni stilovi bloka asistenta
* `/data/places.json`, `/data/transport.json`, `/data/taxi.json`, `/data/restaurants.json` – podatci koje lako mijenjaš bez diranja koda
* U `index.html` ostaje samo **mali HTML blok** + `<script src="./assistant/assistant.js">`

2. **State & preference** (čuva u `localStorage`)

* `homeBase` (npr. “Pine Trees – Agnontas”, ili Auto (GPS))
* `preferredTransport` (Bus / Rent / Taxi / Kombinuj)
* `dayMode` (scenarij: Beach+Dinner, Island loop, Mix, Bad weather)
* `budgetGuard` (prikaži procjenu troška dana)

3. **“Mode” scenariji (ono što si tražio)**

* **A) Beach + Dinner Nearby**: jutarnji bus/taxi do plaže → chill/snorkel → taverna 5–10 min pješke → povratak
* **B) Island Loop (avantura)**: Agios Ioannis → Kastani/Milia → panorama + večera u Chori
* **C) Mix**: pola dana plaža → kasno popodne Skopelos Town (muzej + rooftop/Perivoli)
* **D) Plan B (vjetar/kiša)**: muzeji, kafići, Glossa/Loutraki vidikovci, food-tour

4. **Automatika u pozadini**

* Ako je **GPS dozvoljen**, asistent zna iz koje si zone (Agnontas/Stafylos/Chora) i bira najlogičniji prevoz (prvo bus, fallback taxi).
* Želiš li, može i “pseudo-vrijeme”: ručna selekcija “mirno more / vjetrovito”, pa nudi/izbjegava čamac/SUP.
* U plan ubacuje **Google Maps linkove**, **procjenu bus/taxi cijene** (iz tvoje tabele), i **trajanje**.

---

# 1) HTML blok (ubaci gdje želiš u index.html)

```html
<section id="ai-assistant" class="info-card" style="border-left:5px solid #673ab7;">
  <h2 style="margin-bottom:12px;">🤖 AI asistent — dnevni plan</h2>
  <form id="ai-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">
    <label>
      🏠 Polazna lokacija
      <select name="homeBase" id="homeBase">
        <option value="auto">Auto (GPS)</option>
        <option value="pineTrees">The Pine Trees — Agnontas</option>
        <option value="stafylos">Stafylos</option>
        <option value="chora">Skopelos Town (Chora)</option>
      </select>
    </label>

    <label>
      🧭 Način dana
      <select name="dayMode" id="dayMode">
        <option value="beachDinner">Morski dan + večera blizu plaže</option>
        <option value="islandLoop">Obilazak ostrva (avantura)</option>
        <option value="mix">Mix: plaža + grad</option>
        <option value="badWeather">Plan B (vjetar/kiša)</option>
      </select>
    </label>

    <label>
      🚍 Prevoz
      <select name="transport" id="transport">
        <option value="bus">Autobus</option>
        <option value="rent">Rent (auto/quad)</option>
        <option value="taxi">Taxi</option>
        <option value="smart">Kombinuj (pametni izbor)</option>
      </select>
    </label>

    <label>
      🌊 Uslovi mora/vjetar
      <select name="sea" id="sea">
        <option value="calm">Mirno</option>
        <option value="breezy">Lagano vjetrovito</option>
        <option value="windy">Vjetrovito (izbjegni čamac/SUP)</option>
      </select>
    </label>

    <button type="button" id="generatePlan"
      style="grid-column:1/-1;padding:10px 14px;background:#673ab7;color:#fff;border:none;border-radius:8px;cursor:pointer;">
      📅 Generiši plan za danas
    </button>
  </form>

  <div id="ai-output" style="margin-top:14px;"></div>
</section>
<link rel="stylesheet" href="./assistant/assistant.css">
<script defer src="./assistant/assistant.js"></script>
```

---

# 2) Primjer podataka (JSON fajlovi)

`/data/places.json` (skraćeno; dodaj još koliko hoćeš)

```json
{
  "bases": {
    "pineTrees": {"name":"The Pine Trees","lat":39.08304,"lon":23.71354},
    "stafylos": {"name":"Stafylos","lat":39.0959,"lon":23.7459},
    "chora":    {"name":"Skopelos Town","lat":39.1240,"lon":23.7451}
  },
  "beaches": [
    {"id":"panormos","name":"Panormos Beach","area":"Panormos","tags":["organized","snorkel"], "gmaps":"https://maps.google.com/?q=Panormos+Beach+Skopelos"},
    {"id":"milia","name":"Milia Beach","area":"Panormos","tags":["clearWater","snorkel"], "gmaps":"https://maps.google.com/?q=Milia+Beach+Skopelos"},
    {"id":"kastani","name":"Kastani Beach","area":"Panormos","tags":["mammamia"], "gmaps":"https://maps.google.com/?q=Kastani+Beach+Skopelos"},
    {"id":"limnonari","name":"Limnonari Beach","area":"Agnontas","tags":["sheltered"], "gmaps":"https://maps.google.com/?q=Limnonari+Beach+Skopelos"}
  ],
  "sights": [
    {"id":"agiosIoannis","name":"Agios Ioannis Kastri","gmaps":"https://maps.google.com/?q=Agios+Ioannis+Kastri+Skopelos"},
    {"id":"folklore","name":"Folklore Museum of Skopelos","gmaps":"https://maps.google.com/?q=Folklore+Museum+of+Skopelos"},
    {"id":"vakratsa","name":"Vakratsa Mansion","gmaps":"https://maps.google.com/?q=Vakratsa+Mansion+Skopelos"}
  ]
}
```

`/data/taxi.json` (iz tvoje fotke — možeš dopuniti)

```json
{
  "from_chora": {
    "Hotels (RIGAS, HOLIDAYS, ALKISTIS, AGERI)": 5,
    "Glisteri": 15,
    "Stafylos (down to the beach)": 10,
    "Agnontas": 15,
    "Limnonari (down to the beach)": 17,
    "Panormos": 20,
    "Milia (down to the beach)": 25,
    "Kastani (down to the beach)": 25,
    "Ftelia": 25,
    "N. Klima Chovolo": 30,
    "Glossa": 40,
    "Loutraki": 50
  }
}
```

`/data/transport.json` (minimalni primjer za bus; popuni kasnije)

```json
{
  "bus_prices": {
    "Agnontas-Skopelos": [2.2, 2.6],
    "Agnontas-Panormos": [3.0, 3.5],
    "Agnontas-Stafylos": [1.8, 2.1],
    "Agnontas-Glossa":   [6.5, 7.5]
  },
  "timetable_hint": "Provjeri službeni raspored na skopelostransports.gr neposredno prije polaska."
}
```

`/data/restaurants.json` (par komada dovoljnih za start)

```json
[
  {"id":"delfini","name":"Delfini Taverna","area":"Agnontas","near":"beach","gmaps":"https://maps.google.com/?q=Delfini+Taverna+Skopelos"},
  {"id":"korali","name":"Korali Taverna","area":"Agnontas","near":"beach","gmaps":"https://maps.google.com/?q=Korali+Taverna+Skopelos"},
  {"id":"perivoli","name":"Perivoli Restaurant","area":"Chora","near":"garden","gmaps":"https://maps.google.com/?q=Perivoli+Skopelos"},
  {"id":"anatoli","name":"Anatoli Taverna","area":"Chora","near":"view","gmaps":"https://maps.google.com/?q=Anatoli+Taverna+Skopelos"}
]
```

---

# 3) `assistant.js` (skelet sa “mode” logikom)

```js
// /assistant/assistant.js
(async function () {
  // --- Učitavanje podataka ---
  const [places, transport, taxi, restaurants] = await Promise.all([
    fetch('./data/places.json').then(r => r.json()),
    fetch('./data/transport.json').then(r => r.json()),
    fetch('./data/taxi.json').then(r => r.json()),
    fetch('./data/restaurants.json').then(r => r.json())
  ]);

  const els = {
    homeBase: document.getElementById('homeBase'),
    dayMode: document.getElementById('dayMode'),
    transport: document.getElementById('transport'),
    sea: document.getElementById('sea'),
    generate: document.getElementById('generatePlan'),
    out: document.getElementById('ai-output')
  };

  // --- Helperi ---
  function gm(link, label = '📍 Mapa') {
    return `<a href="${link}" target="_blank" rel="noopener">${label}</a>`;
  }
  function money(x) { return `€${x.toFixed(0)}`; }

  function taxiPriceFromChora(toName){
    const t = taxi.from_chora;
    // fuzzy match
    const key = Object.keys(t).find(k => k.toLowerCase().includes(toName.toLowerCase()));
    return key ? t[key] : null;
  }

  function busPrice(key){
    const range = transport.bus_prices[key];
    if(!range) return null;
    const avg = (range[0] + range[1]) / 2;
    return {avg, text:`≈ €${range[0].toFixed(1)}–€${range[1].toFixed(1)}`};
  }

  function pickNearbyDinner(area){
    // jednostavno: prvo najbliže u tom području
    const opts = restaurants.filter(r => r.area.toLowerCase().includes(area.toLowerCase()));
    return opts[0] || restaurants[0];
  }

  async function getBaseCoords(value){
    if(value === 'auto' && navigator.geolocation){
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, {timeout:5000}));
        return {lat: pos.coords.latitude, lon: pos.coords.longitude, label:'GPS'};
      } catch(e) { /* pad na Pine Trees */ }
    }
    const map = { pineTrees: 'pineTrees', stafylos: 'stafylos', chora: 'chora' };
    const id = map[value] || 'pineTrees';
    const b = places.bases[id];
    return {lat: b.lat, lon: b.lon, label: b.name};
  }

  function planBeachDinner(base, sea, transportPref){
    // heuristika: ako je bas windy -> izbjegni čamac/SUP; izaberi zaklonjene uvale (npr. Limnonari)
    const shelteredFirst = sea === 'windy';
    const beach = shelteredFirst
      ? (places.beaches.find(b => b.id === 'limnonari') || places.beaches[0])
      : (places.beaches.find(b => b.id === 'panormos') || places.beaches[0]);

    const dinner = pickNearbyDinner(beach.area === 'Agnontas' ? 'Agnontas' : (beach.area || 'Chora'));

    // trošak prevoza – grubo:
    let transportNote = '';
    let cost = 0;
    if(transportPref === 'bus' || transportPref === 'smart'){
      const routeKey = `Agnontas-${beach.area === 'Panormos' ? 'Panormos' : 'Skopelos'}`;
      const bp = busPrice(routeKey);
      if(bp){ transportNote = `🚌 Bus ${bp.text} po osobi (provjeri raspored)`; cost += bp.avg * 2; }
      else transportNote = '🚌 Bus (provjera cijene na licu mjesta)';
    }
    if(transportPref === 'taxi'){
      const to = beach.name;
      const p = taxiPriceFromChora(to) || taxiPriceFromChora(beach.area || '');
      if(p){ transportNote = `🚕 Taxi iz Chore ≈ ${money(p)} (jedan smjer)`; cost += p*2; }
      else transportNote = '🚕 Taxi (cijena zavisi od rute)';
    }
    // rent varijanta – samo hint:
    if(transportPref === 'rent'){ transportNote = '🚗 Rent (gorivo + osiguranje) ~ €20–30/dan (grubo)'; cost += 25; }

    return {
      title: 'Morski dan + večera blizu plaže',
      items: [
        {time:'09:30', what:`Polazak iz baze (${base.label}) → ${beach.name}`, link: gm(beach.gmaps, 'Plaža mapa')},
        {time:'10:15–17:00', what:`Kupanje/snorkel (${beach.tags?.join(', ') || 'plaža'})`},
        {time:'17:30', what:`Večera: ${dinner.name} (${dinner.area})`, link: gm(dinner.gmaps, 'Restoran mapa')},
        {time:'19:30–20:00', what:`Povratak u smještaj`},
      ],
      transportNote,
      estCostNote: `💶 Okvirni prevoz danas: ${money(cost)} (za dvoje, grubo)`,
    };
  }

  function planIslandLoop(){
    const s1 = places.sights.find(s=>s.id==='agiosIoannis');
    const b1 = places.beaches.find(b=>b.id==='kastani') || places.beaches[0];
    return {
      title:'Obilazak ostrva (avantura)',
      items:[
        {time:'09:00', what:`Polazak ka ${s1.name}`, link: gm(s1.gmaps)},
        {time:'11:30', what:`Spust do ${b1.name} (kupanje/foto)`, link: gm(b1.gmaps)},
        {time:'18:30', what:`Večera u Chori (Perivoli/Anatoli)`}
      ],
      transportNote:'🚌/🚗 Planiraj transfer između tačaka; izbjegni duge presjedanja popodne.',
      estCostNote:'💶 Prevoz zavisi od izbora (bus/taxi/rent).'
    };
  }

  function planMix(){
    const b = places.beaches.find(b=>b.id==='milia') || places.beaches[0];
    const fol = places.sights.find(s=>s.id==='folklore');
    return {
      title:'Mix: plaža + grad',
      items:[
        {time:'10:00', what:`Plaža ${b.name}`, link: gm(b.gmaps)},
        {time:'16:30', what:`Chora: ${fol.name} + šetnja Kastro`, link: gm(fol.gmaps)},
        {time:'20:00', what:`Večera u Chori (Perivoli/Anatoli)`}
      ],
      transportNote:'🚌 Lako izvesti uz 2 vožnje (jutro/večer).',
      estCostNote:'💶 Bus ~€8–10 ukupno po osobi (2 smjera).'
    };
  }

  function planBadWeather(){
    const v = places.sights.find(s=>s.id==='vakratsa');
    return {
      title:'Plan B (vjetar/kiša)',
      items:[
        {time:'11:00', what:`Muzeji i galerije (Folklore, Vakratsa)`, link: gm(v.gmaps)},
        {time:'14:00', what:`Kafići i bašte (Chora)`},
        {time:'19:30', what:`Večera (baštenski ambijent: Perivoli)`},
      ],
      transportNote:'🚶‍♀️/🚌 Minimalno kretanje, sve u Chori.',
      estCostNote:'💶 Nema troška prevoza (osim bus/taxi ako treba).'
    };
  }

  // --- Render ---
  function render(plan){
    const rows = plan.items.map(i => `
      <tr><td style="width:90px;"><strong>${i.time}</strong></td>
          <td>${i.what}${i.link ? ' — ' + i.link : ''}</td></tr>`).join('');
    els.out.innerHTML = `
      <div class="card" style="background:#fff;">
        <h3 style="margin-bottom:8px;">${plan.title}</h3>
        <div class="table-responsive">
          <table class="transport-table">
            <tbody>${rows}</tbody>
          </table>
        </div>
        <p style="margin:8px 0;">${plan.transportNote}</p>
        <p style="margin:0;font-weight:600;">${plan.estCostNote}</p>
        <button id="copyPlan" style="margin-top:10px;padding:8px 12px;border:1px solid #673ab7;background:#fff;color:#673ab7;border-radius:8px;cursor:pointer;">📋 Kopiraj u clipboard</button>
      </div>`;
    document.getElementById('copyPlan').onclick = () => {
      const txt = plan.items.map(i=>`${i.time} – ${i.what}`).join('\n');
      navigator.clipboard.writeText(txt);
    };
  }

  // --- Generate click ---
  els.generate.addEventListener('click', async () => {
    // zapamti preference
    localStorage.setItem('aiPrefs', JSON.stringify({
      homeBase: els.homeBase.value,
      dayMode: els.dayMode.value,
      transport: els.transport.value,
      sea: els.sea.value
    }));

    const base = await getBaseCoords(els.homeBase.value);
    let plan;
    if(els.dayMode.value === 'beachDinner') plan = planBeachDinner(base, els.sea.value, els.transport.value);
    else if(els.dayMode.value === 'islandLoop') plan = planIslandLoop();
    else if(els.dayMode.value === 'mix') plan = planMix();
    else plan = planBadWeather();
    render(plan);
  });

  // učitaj preference
  const saved = JSON.parse(localStorage.getItem('aiPrefs') || '{}');
  if(saved.homeBase) els.homeBase.value = saved.homeBase;
  if(saved.dayMode) els.dayMode.value = saved.dayMode;
  if(saved.transport) els.transport.value = saved.transport;
  if(saved.sea) els.sea.value = saved.sea;
})();
```

---

# 4) Zašto je ovo praktično

* **Brza izmjena**: sve rute/cijene/karte su u JSON-u (npr. taxi cjenovnik iz tvoje slike), pa lako dodaš/izmijeniš bez diranja JS logike.
* **Scenariji**: “mode” tačno rade ono što želiš — *ne samo doručak/ručak/večera*, nego kombinacije aktivnosti s prevozom i večerom u blizini.
* **Linkovi & trošak**: svaka aktivnost ima **Google Maps** link i **okvir troška prevoza**, uz podsjetnik za provjeru bus rasporeda.
* **Mobilno spremno**: oslanja se na tvoje postojeće responsive stilove + mali card output.

---

# 5) Šta dalje (ako ti odgovara ovakav pristup)

* **Dodati “vremenski slot”** (Jutro/Popodne/Večer) kao prekidač → asistent automatski skraćuje/rotira redoslijed.
* **“Pametni izbor” prevoza**: ako je ruta kratka → bus; ako je kasno i nema busa → taxi; ako plan uključuje 3+ tačke razbacane → predloži rent.
* **Budžetski modul**: zbrajanje dnevnog prevoza + okvir potrošnje (npr. €25–€35 po osobi za hranu) i upis u “Finansije”.
* **(Opcionalno) GPS**: već uključeno — uz korisnikovu dozvolu, lakše biramo “najbližu” plažu/stanicu.

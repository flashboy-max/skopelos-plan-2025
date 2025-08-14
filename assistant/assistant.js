// 🤖 Skopelos AI Assistant - Modularni sistem za personalizovano planiranje
// Verzija: 2.0 - Napredni scenariji sa pametnim algoritmima

// === GLOBALNE VARIJABLE ===
let placesData = null;
let restaurantsData = null;
let transportData = null;
let activitiesData = null;
let currentWeatherData = null;

// === UČITAVANJE PODATAKA ===
async function loadData() {
    try {
        const [places, restaurants, transport, activities] = await Promise.all([
            fetch('./data/places.json').then(r => r.json()),
            fetch('./data/restaurants.json').then(r => r.json()),
            fetch('./data/transport.json').then(r => r.json()),
            fetch('./data/activities.json').then(r => r.json())
        ]);
    // === RENDERING ===
function renderPlan(plan) {
    const output = document.getElementById('ai-output');
    
    let html = '';
    
    // Weather widget (if weather data available)
    if (plan.weatherData && plan.weatherData.current) {
        html += renderWeatherWidget(plan.weatherData);
    }
    
    // Weather override notification
    if (plan.weatherOverride) {
        html += `
            <div style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); 
                        color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;
                        border-left: 4px solid #ffffff;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5em;">🌦️</span>
                    <div>
                        <strong>AI preporučuje drugačiji scenario</strong><br>
                        <small style="opacity: 0.9;">
                            Umesto "${plan.weatherOverride.original}" → "${plan.weatherOverride.suggested}"<br>
                            Razlog: ${plan.weatherOverride.reason}
                        </small>
                    </div>
                </div>
            </div>
        `;
    }
    
    html += `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 1.5em;">${plan.title}</h3>
            <div style="opacity: 0.9; font-size: 0.95em;">
                ${plan.budgetNote || ''}
            </div>
        </div>`;  placesData = places;
        restaurantsData = restaurants;
        transportData = transport;
        activitiesData = activities;
        
        // Load weather data if weather module is available
        if (window.weatherManager) {
            currentWeatherData = await window.weatherManager.getWeatherData();
            console.log('🌦️ Weather data loaded');
        }
        
        console.log('✅ Svi podaci su uspešno učitani');
        return true;
    } catch (error) {
        console.error('❌ Greška prilikom učitavanja podataka:', error);
        return false;
    }
}

// === POMOĆNE FUNKCIJE ===
function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function pickRandomExcept(array, except) {
    const filtered = array.filter(item => item.id !== except.id);
    return pickRandom(filtered);
}

function gm(url) {
    return `<a href="${url}" target="_blank" style="color:#2196F3; text-decoration:none;">📍 Google Maps</a>`;
}

function formatTime(hour, minute = 0) {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// === PAMETNI TRANSPORT ALGORITAM ===
function smartTransportChoice(from, to, distance, weather, time, destinations = 1) {
    const transport = transportData;
    
    // Više destinacija = rent car
    if (destinations > 2) {
        return {
            type: 'rent',
            cost: transport.rent.costPerDay + transport.rent.fuel,
            reason: 'Više lokacija u toku dana - rent je efikasniji',
            details: `${transport.rent.costPerDay}€ rent + ${transport.rent.fuel}€ gorivo`
        };
    }
    
    // Kratke rute + dobro vreme = bus
    if (distance <= 20 && weather !== 'windy' && weather !== 'rainy' && time !== 'late') {
        return {
            type: 'bus',
            cost: transport.bus.costPerRide * 2, // povratna karta
            reason: 'Kratka ruta, idealno za javni prevoz',
            details: `${transport.bus.costPerRide}€ × 2 (povratno)`
        };
    }
    
    // Kasno vreme ili loše vreme = taxi
    if (time === 'late' || weather === 'windy' || weather === 'rainy') {
        const taxiCost = transport.taxi.costBase + (distance * transport.taxi.costPerKm);
        return {
            type: 'taxi',
            cost: taxiCost,
            reason: 'Brže i sigurnije u ovim uslovima',
            details: `${transport.taxi.costBase}€ + ${distance}km × ${transport.taxi.costPerKm}€`
        };
    }
    
    // Default: bus
    return {
        type: 'bus',
        cost: transport.bus.costPerRide * 2,
        reason: 'Optimalan izbor za ovako kratku rutu',
        details: `${transport.bus.costPerRide}€ × 2 (povratno)`
    };
}

// === BUDŽET KALKULATOR ===
function calculateBudget(plan, transportChoice) {
    let total = 0;
    let breakdown = [];
    
    // Transport troškovi
    total += transportChoice.cost;
    breakdown.push(`🚗 Transport (${transportChoice.type}): €${transportChoice.cost}`);
    
    // Hrana (aproksimacija na osnovu restorana)
    let foodCost = 45; // default
    if (plan.restaurant) {
        if (plan.restaurant.priceRange === '€€€') foodCost = 65;
        else if (plan.restaurant.priceRange === '€€') foodCost = 45;
        else foodCost = 30;
    }
    total += foodCost;
    breakdown.push(`🍽️ Hrana i piće: €${foodCost}`);
    
    // Aktivnosti
    if (plan.activities && plan.activities.length > 0) {
        const activityCost = plan.activities.reduce((sum, activity) => sum + activity.price, 0);
        if (activityCost > 0) {
            total += activityCost;
            breakdown.push(`🏃 Aktivnosti: €${activityCost}`);
        }
    }
    
    // Dodatni troškovi (parking, napojnice, itd.)
    const extra = Math.round(total * 0.1);
    total += extra;
    breakdown.push(`💡 Ostalo (parking, napojnice): €${extra}`);
    
    return {
        total: Math.round(total),
        breakdown: breakdown,
        perPerson: Math.round(total / 2)
    };
}

// === SCENARIO 1: BEACH + DINNER ===
function planBeachDinner(seaCondition, weather) {
    console.log('🏖️ Generišem Beach + Dinner plan...');
    
    // Biramo plažu na osnovu uslova
    let selectedBeach;
    if (seaCondition === 'rough' || weather === 'windy') {
        selectedBeach = placesData.beaches.find(b => b.sheltered) || placesData.beaches[0];
    } else {
        selectedBeach = pickRandom(placesData.beaches.filter(b => b.difficulty === 'easy'));
    }
    
    // Biramo restoran u istoj oblasti ili blizu
    let selectedRestaurant = restaurantsData.find(r => r.area === selectedBeach.area);
    if (!selectedRestaurant) {
        selectedRestaurant = pickRandom(restaurantsData.filter(r => r.area !== 'Thessaloniki'));
    }
    
    // Transport
    const transport = smartTransportChoice(
        'The Pine Trees', selectedBeach.name, 
        selectedBeach.distance, weather, 'morning', 1
    );
    
    const plan = {
        title: `🏖️ ${selectedBeach.name} + Večera`,
        beach: selectedBeach,
        restaurant: selectedRestaurant,
        transport: transport,
        items: [
            {
                time: '10:30',
                what: `Polazak ka ${selectedBeach.name}`,
                link: gm(selectedBeach.gmaps)
            },
            {
                time: '11:00–17:00',
                what: `Opuštanje na ${selectedBeach.name}`,
                details: `${selectedBeach.bestFor.join(', ')}`
            },
            {
                time: '18:30',
                what: `Večera u ${selectedRestaurant.name}`,
                link: gm(selectedRestaurant.gmaps),
                details: `${selectedRestaurant.speciality} - ${selectedRestaurant.priceRange}`
            },
            {
                time: '21:00',
                what: 'Povratak na bazu'
            }
        ],
        tips: [
            `🌊 More: ${seaCondition === 'rough' ? 'Nemirno - odabrana zaštićena plaža' : 'Mirno - idealno za kupanje'}`,
            `🚗 ${transport.reason}`,
            `🍽️ ${selectedRestaurant.name} specijalizovan za ${selectedRestaurant.speciality}`
        ]
    };
    
    // Dodaj budžet
    const budget = calculateBudget(plan, transport);
    plan.budget = budget;
    plan.budgetNote = `💰 Ukupno: €${budget.total} (€${budget.perPerson} po osobi)`;
    
    return plan;
}

// === SCENARIO 2: ISLAND LOOP ===
function planIslandLoop(seaCondition, weather) {
    console.log('🗺️ Generišem Island Loop plan...');
    
    // Uvek biramo 3 različite lokacije
    const beach1 = pickRandom(placesData.beaches.filter(b => b.difficulty === 'easy'));
    const beach2 = pickRandomExcept(placesData.beaches.filter(b => b.area !== beach1.area), beach1);
    const beach3 = pickRandomExcept(placesData.beaches, beach1);
    
    // Restaurant u drugoj oblasti
    const restaurant = pickRandom(restaurantsData.filter(r => 
        r.area !== 'Thessaloniki' && r.area !== beach1.area
    ));
    
    // Za više destinacija - definitivno rent
    const transport = {
        type: 'rent',
        cost: transportData.rent.costPerDay + transportData.rent.fuel,
        reason: 'Više lokacija - rent car je jedina opcija',
        details: `${transportData.rent.costPerDay}€ rent + ${transportData.rent.fuel}€ gorivo`
    };
    
    const plan = {
        title: '🗺️ Obilazak Ostrva (Avantura)',
        beaches: [beach1, beach2, beach3],
        restaurant: restaurant,
        transport: transport,
        items: [
            {
                time: '09:00',
                what: 'Preuzimanje rent-a-car'
            },
            {
                time: '09:30',
                what: `Prva destinacija: ${beach1.name}`,
                link: gm(beach1.gmaps),
                details: `${beach1.bestFor.join(', ')}`
            },
            {
                time: '12:00',
                what: `Druga destinacija: ${beach2.name}`,
                link: gm(beach2.gmaps)
            },
            {
                time: '15:00',
                what: `Ručak u ${restaurant.name}`,
                link: gm(restaurant.gmaps),
                details: `${restaurant.speciality} - ${restaurant.priceRange}`
            },
            {
                time: '17:00',
                what: `Treća destinacija: ${beach3.name}`,
                link: gm(beach3.gmaps)
            },
            {
                time: '19:30',
                what: 'Povratak i vraćanje vozila'
            }
        ],
        tips: [
            '🚗 Rent car obavezno - višestruke destinacije',
            '⛽ Tankovanje na početku - uračunato u budžet',
            '📱 Google Maps offline download preporučeno',
            `🌊 ${seaCondition === 'rough' ? 'Nemirno more - birane zaštićene plaže' : 'Idealno vreme za istraživanje'}`
        ]
    };
    
    // Dodaj budžet
    const budget = calculateBudget(plan, transport);
    plan.budget = budget;
    plan.budgetNote = `💰 Ukupno: €${budget.total} (€${budget.perPerson} po osobi)`;
    
    return plan;
}

// === SCENARIO 3: MIX (PLAŽA + GRAD) ===
function planMix(seaCondition, weather) {
    console.log('🏛️ Generišem Mix plan...');
    
    // Bliska plaža za kraće vreme
    const closeBeach = placesData.beaches.find(b => b.distance <= 10) || placesData.beaches[0];
    
    // Restoran u gradu
    const cityRestaurant = restaurantsData.find(r => r.area === 'Skopelos Town') || 
                          pickRandom(restaurantsData.filter(r => r.area !== 'Thessaloniki'));
    
    // Kulturna aktivnost
    const activity = pickRandom(activitiesData.filter(a => a.category === 'cultural'));
    
    // Transport - kratka ruta, bus je OK
    const transport = smartTransportChoice(
        'The Pine Trees', closeBeach.name,
        closeBeach.distance, weather, 'morning', 2
    );
    
    const plan = {
        title: '🏛️ Mix: Plaža + Grad + Kultura',
        beach: closeBeach,
        restaurant: cityRestaurant,
        activity: activity,
        transport: transport,
        activities: [activity],
        items: [
            {
                time: '10:00',
                what: `Jutarnje kupanje na ${closeBeach.name}`,
                link: gm(closeBeach.gmaps),
                details: 'Kratka sesija na plaži'
            },
            {
                time: '13:00',
                what: 'Povratak u grad Skopelos'
            },
            {
                time: '14:00',
                what: `${activity.name}`,
                details: activity.description
            },
            {
                time: '16:30',
                what: 'Šetnja kroz stari grad'
            },
            {
                time: '18:30',
                what: `Večera u ${cityRestaurant.name}`,
                link: gm(cityRestaurant.gmaps),
                details: `${cityRestaurant.speciality} - ${cityRestaurant.priceRange}`
            },
            {
                time: '21:00',
                what: 'Noćna šetnja i povratak'
            }
        ],
        tips: [
            '🏛️ Kombinacija plaže i kulture',
            `🚗 ${transport.reason}`,
            '📸 Idealno za fotografije u gradu',
            `🎯 ${activity.description}`
        ]
    };
    
    // Dodaj budžet
    const budget = calculateBudget(plan, transport);
    plan.budget = budget;
    plan.budgetNote = `💰 Ukupno: €${budget.total} (€${budget.perPerson} po osobi)`;
    
    return plan;
}

// === SCENARIO 4: PLAN B (LOŠE VREME) ===
function planBadWeather(seaCondition, weather) {
    console.log('☔ Generišem Plan B za loše vreme...');
    
    // Indoor aktivnosti i zaštićene lokacije
    const indoorActivity = activitiesData.find(a => !a.weatherDependent) || 
                          activitiesData.find(a => a.category === 'cultural');
    
    // Restoran sa good ambijentom
    const cozyRestaurant = restaurantsData.find(r => r.cozy && r.area !== 'Thessaloniki') ||
                          pickRandom(restaurantsData.filter(r => r.area !== 'Thessaloniki'));
    
    // Možda kratka poseta zaštićenoj plaži ako nije baš strašno
    const shelteredBeach = placesData.beaches.find(b => b.sheltered);
    
    // Transport - taxi zbog vremena
    const transport = smartTransportChoice(
        'The Pine Trees', 'Skopelos Town',
        8, weather, 'morning', 1
    );
    
    const plan = {
        title: '☔ Plan B - Loše Vreme',
        restaurant: cozyRestaurant,
        activity: indoorActivity,
        transport: transport,
        activities: indoorActivity ? [indoorActivity] : [],
        items: [
            {
                time: '11:00',
                what: 'Polazak u grad (zaštićeno od vremena)'
            },
            {
                time: '11:30',
                what: `${indoorActivity.name}`,
                details: indoorActivity.description
            },
            {
                time: '14:00',
                what: 'Ručak + kafana sesija',
                details: 'Produžena pauza u toplom'
            },
            {
                time: '16:00',
                what: 'Shopping/razgledanje covered oblasti'
            },
            {
                time: '18:00',
                what: weather === 'rainy' ? 
                     'Čekanje da se vreme poboljša' : 
                     `Kratka poseta ${shelteredBeach.name} (zaštićeno)`
            },
            {
                time: '19:30',
                what: `Večera u ${cozyRestaurant.name}`,
                link: gm(cozyRestaurant.gmaps),
                details: `Topao ambijent - ${cozyRestaurant.speciality}`
            }
        ],
        tips: [
            '☔ Plan prilagođen lošem vremenu',
            '🏠 Fokus na indoor aktivnosti',
            `🚗 ${transport.reason}`,
            '☕ Produženi boravak u toplim prostorima',
            weather === 'rainy' ? 
                '🌧️ Kiša - izbegavamo plaže' : 
                '💨 Vetar - moguć kratak boravak na zaštićenoj plaži'
        ]
    };
    
    // Dodaj budžet
    const budget = calculateBudget(plan, transport);
    plan.budget = budget;
    plan.budgetNote = `💰 Ukupno: €${budget.total} (€${budget.perPerson} po osobi)`;
    
    return plan;
}

// === SCENARIO 5: ROMANTIC ===
function planRomantic(seaCondition, weather) {
    console.log('💕 Generišem Romantic plan...');
    
    // Biramo plažu sa prelepim zalascima ili romantičnu atmosferu
    let romanticBeach = placesData.beaches.find(b => b.sunset && b.tags.includes('scenic'));
    if (!romanticBeach) {
        romanticBeach = placesData.beaches.find(b => b.sunset) || placesData.beaches[0];
    }
    
    // Romantični restoran
    let romanticRestaurant = restaurantsData.find(r => r.romantic && r.area !== 'Thessaloniki');
    if (!romanticRestaurant) {
        romanticRestaurant = restaurantsData.find(r => r.priceRange === '€€€' && r.area !== 'Thessaloniki');
    }
    
    // Romantic aktivnost
    const romanticActivity = activitiesData.find(a => a.category === 'romantic') || 
                            activitiesData.find(a => a.name.includes('sunset'));
    
    // Transport - romantično putovanje
    const transport = smartTransportChoice(
        'The Pine Trees', romanticBeach.name,
        romanticBeach.distance, weather, 'morning', 1
    );
    
    const plan = {
        title: '💕 Romantični Dan za Dvoje',
        beach: romanticBeach,
        restaurant: romanticRestaurant,
        activity: romanticActivity,
        transport: transport,
        activities: romanticActivity ? [romanticActivity] : [],
        items: [
            {
                time: '10:00',
                what: `Romantic getaway ka ${romanticBeach.name}`,
                link: gm(romanticBeach.gmaps),
                details: 'Privatno mesto za nas dvoje'
            },
            {
                time: '10:30–16:30',
                what: 'Intimno sunčanje i kupanje',
                details: 'Samo mi dvoje, daleko od gužve'
            },
            {
                time: '12:30',
                what: 'Piknik na plaži',
                details: 'Doneo sam vino i grčke specialitete'
            },
            {
                time: '17:00',
                what: 'Vraćanje da se spremimo za veče'
            },
            {
                time: '18:30',
                what: romanticActivity ? 
                     `${romanticActivity.name}` : 
                     'Romantična šetnja kroz Agnontas',
                details: romanticActivity ? 
                        romanticActivity.description : 
                        'Držanje za ruke uz more'
            },
            {
                time: '20:00',
                what: `Romantična večera u ${romanticRestaurant.name}`,
                link: gm(romanticRestaurant.gmaps),
                details: `${romanticRestaurant.speciality} - candle light dinner`
            },
            {
                time: '22:30',
                what: 'Moonlight walk na plaži',
                details: 'Najromantičniji kraj dana'
            }
        ],
        tips: [
            '💕 Ponesiti vino i ćebe za piknik',
            '📸 Savršeno za romantične fotografije',
            `🚗 ${transport.reason}`,
            '🌅 ' + (romanticBeach.sunset ? 
                   `${romanticBeach.name} ima predivan zalazak sunca` : 
                   'Planiraj romantic dinner za zalazak'),
            '💐 Možda ponesiti cveće ili malu pažnju'
        ]
    };
    
    // Dodaj budžet
    const budget = calculateBudget(plan, transport);
    plan.budget = budget;
    plan.budgetNote = `💰 Ukupno: €${budget.total} (€${budget.perPerson} po osobi) - romantic investment!`;
    
    return plan;
}

// === SCENARIO 6: ACTIVE ===
function planActive(seaCondition, weather) {
    console.log('🏃 Generišem Active plan...');
    
    // Biramo plažu sa water sports ili aktivnostima
    let activeBeach = placesData.beaches.find(b => b.watersports);
    if (!activeBeach) {
        activeBeach = placesData.beaches.find(b => b.tags.includes('organized')) || placesData.beaches[0];
    }
    
    // Sport restoran - lak i zdrav
    let sportRestaurant = restaurantsData.find(r => 
        (r.area === activeBeach.area || r.area === 'Skopelos Town') && 
        r.area !== 'Thessaloniki'
    );
    if (!sportRestaurant) {
        sportRestaurant = pickRandom(restaurantsData.filter(r => r.area !== 'Thessaloniki'));
    }
    
    // Aktivne aktivnosti
    const activeActivities = activitiesData.filter(a => a.category === 'active');
    const chosenActivities = activeActivities.slice(0, 2); // Uzmi 2 aktivnosti
    
    // Transport - potrebna mobilnost za više lokacija
    const transport = smartTransportChoice(
        'The Pine Trees', activeBeach.name,
        activeBeach.distance, weather, 'morning', 3
    );
    
    const plan = {
        title: '🏃 Aktivni Sportski Dan',
        beach: activeBeach,
        restaurant: sportRestaurant,
        activities: chosenActivities,
        transport: transport,
        items: [
            {
                time: '08:00',
                what: 'Early bird start - lagan doručak'
            },
            {
                time: '08:30',
                what: 'Jutarnja šetnja/trčanje uz more',
                details: '30 min cardio za zagrevanje'
            },
            {
                time: '09:30',
                what: `Polazak ka ${activeBeach.name}`,
                link: gm(activeBeach.gmaps)
            },
            {
                time: '10:00–13:00',
                what: chosenActivities.length > 0 ? 
                     `${chosenActivities[0].name}` : 
                     'Water sports na plaži',
                details: chosenActivities.length > 0 ? 
                        chosenActivities[0].description : 
                        'SUP, snorkeling, ili beach volleyball'
            },
            {
                time: '13:30',
                what: `Zdrav ručak u ${sportRestaurant.name}`,
                link: gm(sportRestaurant.gmaps),
                details: 'Grilled fish, salate, fresh juice'
            },
            {
                time: '15:30',
                what: chosenActivities.length > 1 ? 
                     `${chosenActivities[1].name}` : 
                     'Planinarenje/hiking',
                details: chosenActivities.length > 1 ? 
                        chosenActivities[1].description : 
                        'Explore nature trails'
            },
            {
                time: '18:00',
                what: 'Cooling down - lako plivanje',
                details: 'Relaksacija posle aktivnog dana'
            },
            {
                time: '19:30',
                what: 'Protein dinner',
                details: 'Napuniti baterije posle aktivan dana'
            }
        ],
        tips: [
            '🏃 Ponesiti sportsku opremu i udobnu obuću',
            '💧 Puno vode i electrolyte napitaka',
            '🧴 Krema za sunce (SPF 30+) - biće puno sunca',
            `🚗 ${transport.reason}`,
            `⚡ ${weather === 'sunny' ? 'Idealno vreme za sport!' : 'Prilagodi aktivnosti vremenu'}`,
            '📱 Fitness tracker za merenje aktivnosti',
            '🥤 Zdravi snekovi: nuts, fruits, protein bar'
        ]
    };
    
    // Dodaj budžet (aktivnosti mogu imati troškove)
    const budget = calculateBudget(plan, transport);
    plan.budget = budget;
    plan.budgetNote = `💰 Ukupno: €${budget.total} (€${budget.perPerson} po osobi) - active lifestyle!`;
    
    return plan;
}

// === GLAVNI GENERATOR ===
async function generateAIPlan() {
    // Proveri da li su podaci učitani
    if (!placesData) {
        const loaded = await loadData();
        if (!loaded) {
            return {
                title: '❌ Greška',
                items: [{
                    time: 'Error',
                    what: 'Nije moguće učitati podatke. Proverite internet konekciju.'
                }],
                tips: ['Osvežite stranicu i pokušajte ponovo']
            };
        }
    }
    
    // Učitaj fresh weather data ako je moguće
    if (window.weatherManager) {
        try {
            currentWeatherData = await window.weatherManager.getWeatherData();
            console.log('🌦️ Fresh weather data loaded for planning');
        } catch (error) {
            console.warn('Weather data unavailable, using fallback:', error);
        }
    }
    
    // Čitanje forme
    const formData = new FormData(document.getElementById('ai-form'));
    const dayMode = formData.get('dayMode');
    const baseLocation = formData.get('baseLocation') || 'pineTrees';
    let seaCondition = formData.get('seaCondition') || 'calm';
    let weather = formData.get('weather') || 'sunny';
    
    // Weather override - koristi real weather data ako je dostupno
    if (currentWeatherData && currentWeatherData.current) {
        const realWeather = currentWeatherData.analysis.condition;
        const realWind = currentWeatherData.analysis.wind;
        
        // Override form values sa real weather
        weather = realWeather;
        if (realWind === 'very_windy' || realWind === 'windy') {
            seaCondition = 'rough';
        }
        
        console.log(`🌦️ Using real weather: ${realWeather}, sea: ${seaCondition}`);
    }
    
    console.log(`🤖 Generišem plan: ${dayMode}, more: ${seaCondition}, vreme: ${weather}`);
    
    // Auto scenario suggestion based on weather
    let suggestedScenario = dayMode;
    if (currentWeatherData && currentWeatherData.scenarios.length > 0) {
        const topWeatherScenario = currentWeatherData.scenarios[0];
        if (topWeatherScenario.priority === 'high') {
            suggestedScenario = topWeatherScenario.id;
            console.log(`🌦️ Weather suggests: ${suggestedScenario} (${topWeatherScenario.reason})`);
        }
    }
    
    // Generisanje na osnovu scenarija
    let plan;
    switch(suggestedScenario) {
        case 'beachDinner':
            plan = planBeachDinner(seaCondition, weather);
            break;
        case 'islandLoop':
            plan = planIslandLoop(seaCondition, weather);
            break;
        case 'mix':
            plan = planMix(seaCondition, weather);
            break;
        case 'romantic':
            plan = planRomantic(seaCondition, weather);
            break;
        case 'active':
            plan = planActive(seaCondition, weather);
            break;
        case 'badWeather':
            plan = planBadWeather(seaCondition, weather);
            break;
        default:
            plan = planBeachDinner(seaCondition, weather);
    }
    
    // Enrich plan with weather data
    if (currentWeatherData) {
        plan.weatherData = currentWeatherData;
        plan.weatherEnhanced = true;
        
        // Add weather alerts to tips
        if (currentWeatherData.alerts && currentWeatherData.alerts.length > 0) {
            plan.weatherAlerts = currentWeatherData.alerts;
        }
        
        // Add clothing recommendations
        if (currentWeatherData.analysis && currentWeatherData.analysis.clothingAdvice) {
            plan.clothingAdvice = currentWeatherData.analysis.clothingAdvice;
        }
        
        // Override scenario if weather forced a change
        if (suggestedScenario !== dayMode) {
            plan.weatherOverride = {
                original: dayMode,
                suggested: suggestedScenario,
                reason: currentWeatherData.scenarios[0]?.reason || 'Weather-based suggestion'
            };
        }
    }
    
    return plan;
}

// === RENDERING ===
function renderPlan(plan) {
    const output = document.getElementById('ai-output');
    
    let html = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 1.5em;">${plan.title}</h3>
            <div style="opacity: 0.9; font-size: 0.95em;">
                ${plan.budgetNote || ''}
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 15px;">
            <h4 style="margin: 0 0 15px 0; color: #333;">📅 Program dana:</h4>
            ${plan.items.map(item => `
                <div style="display: flex; align-items: flex-start; margin-bottom: 12px; 
                           padding: 10px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
                    <strong style="min-width: 60px; color: #667eea;">${item.time}</strong>
                    <div style="margin-left: 15px; flex: 1;">
                        <div>${item.what} ${item.link || ''}</div>
                        ${item.details ? `<small style="color: #666; font-style: italic;">${item.details}</small>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${plan.tips && plan.tips.length > 0 ? `
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #2e7d32;">💡 Saveti:</h4>
                ${plan.tips.map(tip => `<div style="margin-bottom: 5px;">• ${tip}</div>`).join('')}
            </div>
        ` : ''}
        
        ${plan.budget ? `
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #f57f17;">💰 Detaljan Budžet:</h4>
                ${plan.budget.breakdown.map(item => `<div style="margin-bottom: 5px;">• ${item}</div>`).join('')}
                <hr style="margin: 10px 0; border: none; border-top: 1px solid #ddd;">
                <strong>Ukupno: €${plan.budget.total} (€${plan.budget.perPerson} po osobi)</strong>
            </div>
        ` : ''}
    `;
    
    output.innerHTML = html;
    
    // Prikaži dugmiće za favorite i export
    const favoritesSection = document.getElementById('favorites-section');
    if (favoritesSection) {
        favoritesSection.style.display = 'block';
        
        // Sačuvaj trenutni plan globalno
        window.currentPlan = plan;
    }
}

// === WEATHER WIDGET RENDERING ===
function renderWeatherWidget(weatherData) {
    if (!weatherData || !weatherData.current) return '';
    
    const current = weatherData.current;
    const analysis = weatherData.analysis;
    
    // Format weather display
    const temp = Math.round(current.temp || current.main?.temp);
    const description = current.weather[0].description;
    const icon = getWeatherIcon(current.weather[0].icon);
    const feels = current.feels_like ? Math.round(current.feels_like) : null;
    
    // Weather alerts
    let alertsHtml = '';
    if (weatherData.alerts && weatherData.alerts.length > 0) {
        alertsHtml = weatherData.alerts.map(alert => `
            <div class="weather-alert ${alert.type}">
                <div class="weather-alert-icon">${alert.icon}</div>
                <div class="weather-alert-content">
                    <div class="weather-alert-title">${alert.title}</div>
                    <div class="weather-alert-message">${alert.message}</div>
                </div>
            </div>
        `).join('');
    }
    
    // Beach suitability
    const beachScore = analysis.beachSuitability || 50;
    let suitabilityLabel = 'Umeren';
    let suitabilityClass = 'fair';
    if (beachScore >= 80) { suitabilityLabel = 'Odličan'; suitabilityClass = 'excellent'; }
    else if (beachScore >= 60) { suitabilityLabel = 'Dobar'; suitabilityClass = 'good'; }
    else if (beachScore < 40) { suitabilityLabel = 'Loš'; suitabilityClass = 'poor'; }
    
    return `
        <div class="weather-widget ${analysis.condition}">
            <div class="weather-current">
                <div class="weather-main">
                    <div class="weather-icon">${icon}</div>
                    <div class="weather-info">
                        <h3>${temp}°C</h3>
                        <p>${description.charAt(0).toUpperCase() + description.slice(1)}</p>
                        ${feels ? `<p>Osećaj ${feels}°C</p>` : ''}
                    </div>
                </div>
                <div class="weather-temp">
                    <div style="font-size: 0.6em; opacity: 0.8;">Poslednja promena</div>
                    <div style="font-size: 0.5em; opacity: 0.7;">${weatherData.lastUpdate}</div>
                </div>
            </div>
            
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="weather-detail-label">Vetar</div>
                    <div class="weather-detail-value">${Math.round(current.wind_speed || current.wind?.speed || 0)} km/h</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Vlažnost</div>
                    <div class="weather-detail-value">${current.humidity || current.main?.humidity || 0}%</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Vidljivost</div>
                    <div class="weather-detail-value">${Math.round((current.visibility || 10000) / 1000)} km</div>
                </div>
            </div>
            
            ${alertsHtml}
            
            <div class="beach-suitability">
                <div class="suitability-icon">🏖️</div>
                <div class="suitability-info">
                    <div class="suitability-label">Pogodnost za plažu</div>
                    <div class="suitability-score ${suitabilityClass}">${suitabilityLabel} (${beachScore}%)</div>
                    <div class="suitability-bar">
                        <div class="suitability-fill" style="width: ${beachScore}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getWeatherIcon(iconCode) {
    const icons = {
        '01d': '☀️', '01n': '🌙',
        '02d': '⛅', '02n': '☁️', 
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️',
        '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };
    return icons[iconCode] || '🌤️';
}

// === EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', function() {
    // Učitaj podatke na početku
    loadData();
    
    // Generate plan dugme
    const generateBtn = document.getElementById('generatePlan');
    if (generateBtn) {
        generateBtn.addEventListener('click', async function() {
            generateBtn.textContent = '⏳ Generiše se...';
            generateBtn.disabled = true;
            
            try {
                const plan = await generateAIPlan();
                renderPlan(plan);
            } catch (error) {
                console.error('Greška prilikom generisanja plana:', error);
                document.getElementById('ai-output').innerHTML = 
                    '<p style="color: red;">❌ Greška prilikom generisanja plana. Pokušajte ponovo.</p>';
            } finally {
                generateBtn.textContent = '📅 Generiši plan za danas';
                generateBtn.disabled = false;
            }
        });
    }
});

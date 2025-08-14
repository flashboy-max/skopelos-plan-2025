# 🌦️ Weather API Configuration
# FAZA 3.1 - Weather Integration Setup

## OpenWeatherMap API Setup

Da bi weather funkcionalnost radila sa real-time podacima, potreban je API key:

### 1. Registracija na OpenWeatherMap
1. Idite na https://openweathermap.org/api
2. Napravite nalog (besplatan)
3. Potvrdite email adresu
4. Idite na "API Keys" sekciju
5. Kopirajte svoj API key

### 2. Konfiguracija u weather.js

Otvorite `assistant/weather.js` i na liniji 6 zamenite:
```javascript
apiKey: 'demo_key_replace_with_real', // Korisnik će dodati svoj key
```

Sa:
```javascript
apiKey: 'YOUR_ACTUAL_API_KEY_HERE',
```

### 3. Besplatni Plan Ograničenja
- 1,000 API poziva dnevno
- Update interval: 30 minuta
- Dovoljno za normalnu upotrebu

### 4. Mock Data Fallback
Ako nema API key-a, sistem automatski koristi mock podatke:
- Mock weather je uključen za development
- Generisane prognoze za 5 dana
- Funkcionalnost je potpuna i bez API key-a

### 5. Testiranje
- Weather widget se automatski prikazuje u AI Assistant
- Real-time podaci se osvežavaju svakih 30 minuta
- Cache se koristi da smanji broj API poziva

### 6. Weather Features
- ✅ Real-time weather display
- ✅ 5-day forecast
- ✅ Weather alerts and warnings
- ✅ Beach suitability scoring
- ✅ Smart scenario suggestions
- ✅ Clothing and transport advice
- ✅ Weather-based plan modifications

## Upotreba

Weather sistem je automatski integrisan:
1. Učitava se sa ostalim modulima
2. Prikazuje se weather widget
3. AI koristi weather podatke za optimizaciju
4. Suggeste-uje scenarije na osnovu vremena

## Troubleshooting

**Problem**: Weather widget se ne prikazuje
**Rešenje**: Proverite browser console za greške

**Problem**: "Weather API failed" poruka
**Rešenje**: Proverite API key ili internet konekciju

**Problem**: Mock podaci se koriste
**Rešenje**: Dodajte validan API key u weather.js

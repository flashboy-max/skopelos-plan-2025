// 🌦️ Weather API Integration - Pametni vremenski sistem
// FAZA 3.1 - Real-time weather data i smart algorithms

// === WEATHER API CONFIGURATION ===
const WEATHER_CONFIG = {
    // Free OpenWeatherMap API - 1000 calls/day
    apiKey: '6ab372d98d3e3530f812f5cef6840ecf', // Korisnik će dodati svoj key
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    location: {
        lat: 39.0831, // Skopelos coordinates
        lon: 23.7089
    },
    updateInterval: 30 * 60 * 1000, // 30 minuta
    cacheDuration: 15 * 60 * 1000   // 15 minuta cache
};

// === WEATHER DATA CACHE ===
class WeatherCache {
    constructor() {
        this.cache = new Map();
        this.lastUpdate = null;
    }
    
    set(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const age = Date.now() - cached.timestamp;
        if (age > WEATHER_CONFIG.cacheDuration) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    clear() {
        this.cache.clear();
    }
}

// === WEATHER MANAGER ===
class WeatherManager {
    constructor() {
        this.cache = new WeatherCache();
        this.isOnline = navigator.onLine;
        this.setupEventListeners();
        
        // Mock data za development bez API key-a
        this.mockWeatherData = {
            current: {
                temp: 28,
                feels_like: 32,
                humidity: 65,
                wind_speed: 12,
                weather: [{
                    main: 'Clear',
                    description: 'clear sky',
                    icon: '01d'
                }],
                visibility: 10000,
                uv_index: 7
            },
            forecast: this.generateMockForecast()
        };
    }
    
    // === MOCK DATA GENERATOR ===
    generateMockForecast() {
        const conditions = [
            { main: 'Clear', desc: 'clear sky', icon: '01d', temp: 28, wind: 8 },
            { main: 'Clouds', desc: 'few clouds', icon: '02d', temp: 26, wind: 12 },
            { main: 'Rain', desc: 'light rain', icon: '10d', temp: 23, wind: 15 },
            { main: 'Clear', desc: 'clear sky', icon: '01d', temp: 29, wind: 6 },
            { main: 'Clouds', desc: 'scattered clouds', icon: '03d', temp: 27, wind: 10 }
        ];
        
        return Array.from({length: 5}, (_, i) => {
            const condition = conditions[i];
            return {
                dt: Date.now() + (i * 24 * 60 * 60 * 1000),
                temp: {
                    day: condition.temp,
                    min: condition.temp - 5,
                    max: condition.temp + 3
                },
                weather: [{
                    main: condition.main,
                    description: condition.desc,
                    icon: condition.icon
                }],
                wind_speed: condition.wind,
                humidity: 60 + (i * 5),
                pop: condition.main === 'Rain' ? 0.8 : 0.1
            };
        });
    }
    
    // === API CALLS ===
    async getCurrentWeather() {
        // Proverava cache prvo
        const cached = this.cache.get('current');
        if (cached) {
            console.log('🌤️ Using cached weather data');
            return cached;
        }
        
        try {
            if (!this.hasValidApiKey()) {
                console.log('🌤️ Using mock weather data (no API key)');
                return this.mockWeatherData.current;
            }
            
            const response = await fetch(
                `${WEATHER_CONFIG.baseUrl}/weather?lat=${WEATHER_CONFIG.location.lat}&lon=${WEATHER_CONFIG.location.lon}&appid=${WEATHER_CONFIG.apiKey}&units=metric`
            );
            
            if (!response.ok) throw new Error('Weather API error');
            
            const data = await response.json();
            this.cache.set('current', data);
            
            console.log('🌤️ Fresh weather data loaded');
            return data;
            
        } catch (error) {
            console.warn('Weather API failed, using mock data:', error);
            return this.mockWeatherData.current;
        }
    }
    
    async getWeatherForecast() {
        const cached = this.cache.get('forecast');
        if (cached) return cached;
        
        try {
            if (!this.hasValidApiKey()) {
                return this.mockWeatherData.forecast;
            }
            
            const response = await fetch(
                `${WEATHER_CONFIG.baseUrl}/forecast?lat=${WEATHER_CONFIG.location.lat}&lon=${WEATHER_CONFIG.location.lon}&appid=${WEATHER_CONFIG.apiKey}&units=metric`
            );
            
            if (!response.ok) throw new Error('Forecast API error');
            
            const data = await response.json();
            const processedForecast = this.processForecastData(data);
            this.cache.set('forecast', processedForecast);
            
            return processedForecast;
            
        } catch (error) {
            console.warn('Forecast API failed, using mock data:', error);
            return this.mockWeatherData.forecast;
        }
    }
    
    // === WEATHER ANALYSIS ===
    analyzeWeatherConditions(weatherData) {
        const weather = weatherData.weather[0];
        const temp = weatherData.temp || weatherData.main?.temp;
        const windSpeed = weatherData.wind_speed || weatherData.wind?.speed;
        const humidity = weatherData.humidity || weatherData.main?.humidity;
        const visibility = weatherData.visibility || 10000;
        
        return {
            condition: this.categorizeWeather(weather.main),
            temperature: this.categorizeTemperature(temp),
            wind: this.categorizeWind(windSpeed),
            visibility: this.categorizeVisibility(visibility),
            beachSuitability: this.calculateBeachSuitability(weatherData),
            activityRecommendations: this.getActivityRecommendations(weatherData),
            clothingAdvice: this.getClothingAdvice(weatherData),
            transportAdvice: this.getTransportAdvice(weatherData)
        };
    }
    
    categorizeWeather(main) {
        const conditions = {
            'Clear': 'sunny',
            'Clouds': 'cloudy', 
            'Rain': 'rainy',
            'Drizzle': 'rainy',
            'Thunderstorm': 'stormy',
            'Snow': 'snowy',
            'Mist': 'foggy',
            'Fog': 'foggy'
        };
        return conditions[main] || 'unknown';
    }
    
    categorizeTemperature(temp) {
        if (temp >= 30) return 'hot';
        if (temp >= 25) return 'warm';
        if (temp >= 20) return 'mild';
        if (temp >= 15) return 'cool';
        return 'cold';
    }
    
    categorizeWind(speed) {
        if (speed >= 20) return 'very_windy';
        if (speed >= 15) return 'windy';
        if (speed >= 10) return 'breezy';
        return 'calm';
    }
    
    categorizeVisibility(visibility) {
        if (visibility >= 8000) return 'excellent';
        if (visibility >= 5000) return 'good';
        if (visibility >= 2000) return 'moderate';
        return 'poor';
    }
    
    calculateBeachSuitability(weatherData) {
        const analysis = this.analyzeWeatherConditions(weatherData);
        let score = 100;
        
        // Temperature scoring
        if (analysis.temperature === 'hot') score -= 10; // Too hot
        if (analysis.temperature === 'cool') score -= 30;
        if (analysis.temperature === 'cold') score -= 60;
        
        // Weather condition scoring
        if (analysis.condition === 'rainy') score -= 70;
        if (analysis.condition === 'stormy') score -= 90;
        if (analysis.condition === 'cloudy') score -= 20;
        
        // Wind scoring
        if (analysis.wind === 'very_windy') score -= 50;
        if (analysis.wind === 'windy') score -= 25;
        
        return Math.max(0, Math.min(100, score));
    }
    
    getActivityRecommendations(weatherData) {
        const analysis = this.analyzeWeatherConditions(weatherData);
        const recommendations = [];
        
        // Beach activities
        if (analysis.beachSuitability > 70) {
            recommendations.push('beach', 'swimming', 'sunbathing', 'watersports');
        }
        
        // Indoor activities for bad weather
        if (analysis.condition === 'rainy' || analysis.condition === 'stormy') {
            recommendations.push('museums', 'restaurants', 'shopping', 'spa');
        }
        
        // Wind-dependent activities
        if (analysis.wind === 'breezy' || analysis.wind === 'windy') {
            recommendations.push('sailing', 'windsurfing');
        } else {
            recommendations.push('paddleboarding', 'kayaking');
        }
        
        // Temperature-based activities
        if (analysis.temperature === 'hot') {
            recommendations.push('shade_activities', 'indoor_cooling');
        }
        
        return recommendations;
    }
    
    getClothingAdvice(weatherData) {
        const analysis = this.analyzeWeatherConditions(weatherData);
        const advice = [];
        
        // Temperature-based clothing
        switch(analysis.temperature) {
            case 'hot':
                advice.push('Lagana letnja odeća', 'Šešir i naočare', 'Krema za sunčanje SPF 30+');
                break;
            case 'warm':
                advice.push('Kratke rukave', 'Lagane pantalone', 'Krema za sunčanje');
                break;
            case 'mild':
                advice.push('Dugih rukava', 'Lagani džemper za veče');
                break;
            case 'cool':
                advice.push('Jakna ili džemper', 'Duže pantalone');
                break;
        }
        
        // Weather-specific clothing
        if (analysis.condition === 'rainy') {
            advice.push('Kišobran ili kišna jakna', 'Vodootporna obuća');
        }
        
        if (analysis.wind === 'windy' || analysis.wind === 'very_windy') {
            advice.push('Vetrovka', 'Odeća koja se ne razvija');
        }
        
        return advice;
    }
    
    getTransportAdvice(weatherData) {
        const analysis = this.analyzeWeatherConditions(weatherData);
        
        if (analysis.condition === 'rainy' || analysis.condition === 'stormy') {
            return {
                recommended: 'taxi',
                reason: 'Loše vreme - izbegavaj javni transport',
                alternatives: ['rent_car']
            };
        }
        
        if (analysis.wind === 'very_windy') {
            return {
                recommended: 'rent_car',
                reason: 'Vetar može uticati na autobuske linije',
                alternatives: ['taxi']
            };
        }
        
        return {
            recommended: 'bus',
            reason: 'Lepo vreme - idealno za javni transport',
            alternatives: ['rent_car', 'taxi']
        };
    }
    
    // === SCENARIO SUGGESTIONS ===
    getWeatherBasedScenarios(weatherData) {
        const analysis = this.analyzeWeatherConditions(weatherData);
        const scenarios = [];
        
        // Perfect beach day
        if (analysis.beachSuitability > 80) {
            scenarios.push({
                id: 'beachDinner',
                priority: 'high',
                reason: 'Savršeno vreme za plažu!'
            });
            scenarios.push({
                id: 'active',
                priority: 'high',
                reason: 'Idealno za water sports!'
            });
        }
        
        // Good for island exploration
        if (analysis.beachSuitability > 60 && analysis.wind !== 'very_windy') {
            scenarios.push({
                id: 'islandLoop',
                priority: 'medium',
                reason: 'Dobro vreme za istraživanje ostrva'
            });
        }
        
        // Romantic weather
        if (analysis.condition === 'sunny' || analysis.condition === 'cloudy') {
            scenarios.push({
                id: 'romantic',
                priority: 'medium',
                reason: 'Romantična atmosfera'
            });
        }
        
        // Bad weather - indoor activities
        if (analysis.condition === 'rainy' || analysis.condition === 'stormy') {
            scenarios.push({
                id: 'badWeather',
                priority: 'high',
                reason: 'Plan B zbog lošeg vremena'
            });
            scenarios.push({
                id: 'mix',
                priority: 'medium',
                reason: 'Kombinacija indoor i kratkih outdoor aktivnosti'
            });
        }
        
        return scenarios.sort((a, b) => {
            const priorities = { high: 3, medium: 2, low: 1 };
            return priorities[b.priority] - priorities[a.priority];
        });
    }
    
    // === WEATHER ALERTS ===
    checkWeatherAlerts(weatherData) {
        const alerts = [];
        const analysis = this.analyzeWeatherConditions(weatherData);
        
        // Temperature alerts
        if (analysis.temperature === 'hot') {
            alerts.push({
                type: 'warning',
                title: '🌡️ Visoka temperatura',
                message: 'Temperatura preko 30°C - ostani hidratisan i traži hlad',
                icon: '🥵'
            });
        }
        
        // Weather alerts
        if (analysis.condition === 'rainy') {
            alerts.push({
                type: 'info',
                title: '🌧️ Kiša',
                message: 'Ponaši kišobran i prilagodi planove',
                icon: '☔'
            });
        }
        
        if (analysis.condition === 'stormy') {
            alerts.push({
                type: 'danger',
                title: '⛈️ Nevreme',
                message: 'Izabegavaj outdoor aktivnosti i ostani na sigurnom',
                icon: '⚡'
            });
        }
        
        // Wind alerts
        if (analysis.wind === 'very_windy') {
            alerts.push({
                type: 'warning',
                title: '💨 Jak vetar',
                message: 'Vetar preko 20km/h - pazi kod mora i na visnim mestima',
                icon: '🌪️'
            });
        }
        
        // UV alerts
        const uvIndex = weatherData.uv_index || 5;
        if (uvIndex > 7) {
            alerts.push({
                type: 'info',
                title: '☀️ Jak UV indeks',
                message: 'UV indeks visok - koristi SPF 30+ kremu',
                icon: '🧴'
            });
        }
        
        return alerts;
    }
    
    // === HELPER METHODS ===
    hasValidApiKey() {
        return WEATHER_CONFIG.apiKey && 
               WEATHER_CONFIG.apiKey !== 'demo_key_replace_with_real' &&
               WEATHER_CONFIG.apiKey.length > 10;
    }
    
    processForecastData(apiData) {
        // Grupiše po danima i uzima jedan prognoza po danu
        const dailyForecasts = [];
        const processedDays = new Set();
        
        apiData.list.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!processedDays.has(date) && dailyForecasts.length < 5) {
                dailyForecasts.push(item);
                processedDays.add(date);
            }
        });
        
        return dailyForecasts;
    }
    
    setupEventListeners() {
        // Network status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.cache.clear(); // Clear cache when back online
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }
    
    // === PUBLIC API ===
    async getWeatherData() {
        const current = await this.getCurrentWeather();
        const forecast = await this.getWeatherForecast();
        
        return {
            current: current,
            forecast: forecast,
            analysis: this.analyzeWeatherConditions(current),
            scenarios: this.getWeatherBasedScenarios(current),
            alerts: this.checkWeatherAlerts(current),
            lastUpdate: new Date().toLocaleString('sr-RS')
        };
    }
    
    // Format weather for display
    formatWeatherDisplay(weatherData) {
        const temp = Math.round(weatherData.temp || weatherData.main?.temp);
        const desc = weatherData.weather[0].description;
        const icon = this.getWeatherIcon(weatherData.weather[0].icon);
        
        return {
            temperature: `${temp}°C`,
            description: desc.charAt(0).toUpperCase() + desc.slice(1),
            icon: icon,
            feelLike: weatherData.feels_like ? `Osećaj ${Math.round(weatherData.feels_like)}°C` : null
        };
    }
    
    getWeatherIcon(iconCode) {
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
}

// === WEATHER INTEGRATION FOR AI ASSISTANT ===
class WeatherIntegration {
    constructor(weatherManager) {
        this.weather = weatherManager;
    }
    
    // Enhances AI planning with weather data
    async enhanceAIPlan(basePreferences) {
        const weatherData = await this.weather.getWeatherData();
        
        return {
            ...basePreferences,
            weather: weatherData.current,
            weatherAnalysis: weatherData.analysis,
            suggestedScenarios: weatherData.scenarios,
            weatherAlerts: weatherData.alerts,
            enhancedRecommendations: this.generateEnhancedRecommendations(
                basePreferences, 
                weatherData
            )
        };
    }
    
    generateEnhancedRecommendations(preferences, weatherData) {
        const recommendations = [];
        
        // Weather-based scenario adjustment
        const topScenario = weatherData.scenarios[0];
        if (topScenario && topScenario.priority === 'high') {
            recommendations.push({
                type: 'scenario',
                suggestion: `Preporučujem "${topScenario.id}" scenario`,
                reason: topScenario.reason,
                confidence: 0.9
            });
        }
        
        // Transport adjustments
        const transportAdvice = weatherData.analysis.transportAdvice;
        if (transportAdvice.recommended !== preferences.transport) {
            recommendations.push({
                type: 'transport',
                suggestion: `Preporučujem ${transportAdvice.recommended} umesto ${preferences.transport}`,
                reason: transportAdvice.reason,
                confidence: 0.8
            });
        }
        
        // Activity adjustments
        const activities = weatherData.analysis.activityRecommendations;
        recommendations.push({
            type: 'activities',
            suggestion: `Idealne aktivnosti: ${activities.slice(0, 3).join(', ')}`,
            reason: `Na osnovu trenutnih vremenskih uslova`,
            confidence: 0.7
        });
        
        return recommendations;
    }
}

// === INICIJALIZACIJA ===
const weatherManager = new WeatherManager();
const weatherIntegration = new WeatherIntegration(weatherManager);

// === EXPORT ZA MODULARNO KORIŠĆENJE ===
window.WeatherManager = WeatherManager;
window.weatherManager = weatherManager;
window.weatherIntegration = weatherIntegration;

console.log('🌦️ Weather module loaded successfully!');

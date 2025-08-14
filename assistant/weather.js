// 🌦️ Weather API Integration - Pametni vremenski sistem
// FAZA 3.1 - Real-time weather data i smart algorithms

// === WEATHER API CONFIGURATION ===
const WEATHER_CONFIG = {
    // Free OpenWeatherMap API - 1000 calls/day
    apiKey: 'b1fcd61b0aadae316a345d4bc90e25a8', // Primary API key
    fallbackApiKey: '6ab372d98d3e3530f812f5cef6840ecf', // Backup API key
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    location: {
        lat: 39.0831, // Skopelos coordinates
        lon: 23.7089
    },
    updateInterval: 30 * 60 * 1000, // 30 minuta
    cacheDuration: 15 * 60 * 1000,   // 15 minuta cache
    cacheMinutes: 15
};

// Debug mode - log all API calls
const DEBUG_WEATHER = true;

function debugLog(message, ...args) {
    if (DEBUG_WEATHER) {
        console.log(`🌦️ [Weather Debug] ${message}`, ...args);
    }
}

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
        debugLog('WeatherManager initialized');
        this.cache = new WeatherCache();
        this.isOnline = navigator.onLine;
        this.setupEventListeners();
        
        debugLog('Config:', WEATHER_CONFIG);
        debugLog('API Key available:', this.hasValidApiKey());
        
        // Mock data za development bez API key-a
        this.mockWeatherData = {
            current: {
                temp: 29,
                feels_like: 33,
                humidity: 62,
                wind_speed: 8,
                weather: [{
                    main: 'Clear',
                    description: 'sunčano nebo',
                    icon: '01d'
                }],
                visibility: 10000,
                uv_index: 8
            },
            forecast: this.generateMockForecast(),
            lastUpdate: new Date().toLocaleTimeString('sr-RS', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
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
    
    // === API DATA TRANSFORMATION ===
    transformApiData(apiData) {
        // Transform OpenWeatherMap current weather response to our format
        return {
            current: {
                temp: apiData.main.temp,
                feels_like: apiData.main.feels_like,
                humidity: apiData.main.humidity,
                wind_speed: apiData.wind.speed * 3.6, // Convert m/s to km/h
                weather: [{
                    main: apiData.weather[0].main,
                    description: apiData.weather[0].description,
                    icon: apiData.weather[0].icon
                }],
                visibility: apiData.visibility || 10000,
                pressure: apiData.main.pressure
            },
            analysis: this.analyzeWeatherConditions({
                temp: apiData.main.temp,
                humidity: apiData.main.humidity,
                wind_speed: apiData.wind.speed * 3.6,
                weather: apiData.weather[0]
            }),
            location: {
                name: apiData.name || 'Skopelos',
                country: apiData.sys.country || 'GR'
            },
            lastUpdate: new Date().toLocaleTimeString('sr-RS', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            isMockData: false
        };
    }
    
    // === API CALLS ===
    async getCurrentWeather() {
        debugLog('getCurrentWeather() called');
        
        // Proverava cache prvo
        const cached = this.cache.get('current');
        if (cached) {
            debugLog('Using cached weather data');
            return cached;
        }
        
        try {
            if (!this.hasValidApiKey()) {
                debugLog('No valid API key, using mock data');
                
                // Return properly formatted mock data like in catch block
                const mockCurrent = this.mockWeatherData.current;
                return {
                    current: mockCurrent,
                    analysis: this.analyzeWeatherConditions(mockCurrent),
                    location: {
                        name: 'Skopelos',
                        country: 'GR'
                    },
                    lastUpdate: new Date().toLocaleTimeString('sr-RS', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }),
                    isMockData: true
                };
            }
            
            // Try primary API key first with correct OpenWeatherMap format
            let url = `${WEATHER_CONFIG.baseUrl}/weather?lat=${WEATHER_CONFIG.location.lat}&lon=${WEATHER_CONFIG.location.lon}&appid=${WEATHER_CONFIG.apiKey}&units=metric&lang=sr`;
            debugLog('Making API call to:', url.replace(WEATHER_CONFIG.apiKey, 'API_KEY_HIDDEN'));
            
            let response = await fetch(url);
            debugLog('API Response status:', response.status);
            
            // If primary fails, try fallback key
            if (!response.ok && WEATHER_CONFIG.fallbackApiKey) {
                debugLog('Primary API key failed, trying fallback...');
                url = `${WEATHER_CONFIG.baseUrl}/weather?lat=${WEATHER_CONFIG.location.lat}&lon=${WEATHER_CONFIG.location.lon}&appid=${WEATHER_CONFIG.fallbackApiKey}&units=metric&lang=sr`;
                response = await fetch(url);
                debugLog('Fallback API Response status:', response.status);
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                debugLog('Weather API Error:', response.status, errorText);
                throw new Error(`Weather API error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            debugLog('Weather API Response data received:', data);
            
            // Transform OpenWeatherMap format to our format
            const weatherData = this.transformApiData(data);
            debugLog('Transformed weather data:', weatherData);
            
            // Store in cache
            this.cache.set('current', weatherData, Date.now() + WEATHER_CONFIG.cacheMinutes * 60 * 1000);
            debugLog('Weather data cached successfully');
            
            return weatherData;
            
        } catch (error) {
            debugLog('Weather API failed, using mock data:', error);
            
            // Return properly formatted mock data
            const mockCurrent = this.mockWeatherData.current;
            return {
                current: mockCurrent,
                analysis: this.analyzeWeatherConditions(mockCurrent),
                location: {
                    name: 'Skopelos',
                    country: 'GR'
                },
                lastUpdate: new Date().toLocaleTimeString('sr-RS', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                isMockData: true
            };
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
        debugLog('analyzeWeatherConditions called with:', weatherData);
        
        // Safely extract data from both API and mock format
        const weather = weatherData.weather?.[0] || { main: 'Clear', description: 'clear sky' };
        const temp = weatherData.temp || weatherData.main?.temp || 25;
        const windSpeed = weatherData.wind_speed || (weatherData.wind?.speed * 3.6) || 0;
        const humidity = weatherData.humidity || weatherData.main?.humidity || 50;
        const visibility = weatherData.visibility || 10000;
        
        debugLog('Extracted weather values:', { temp, windSpeed, weather, humidity, visibility });
        
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
        // Calculate directly without calling analyzeWeatherConditions to avoid infinite loop
        let score = 100;
        
        const temp = weatherData.temp || weatherData.main?.temp || 25;
        const windSpeed = weatherData.wind_speed || (weatherData.wind?.speed * 3.6) || 0;
        const weather = weatherData.weather?.[0] || { main: 'Clear' };
        const humidity = weatherData.humidity || weatherData.main?.humidity || 50;
        
        // Temperature scoring
        if (temp >= 30) score -= 10; // Too hot
        else if (temp < 20) score -= 30; // Too cool
        else if (temp < 15) score -= 60; // Too cold
        
        // Weather condition scoring
        if (weather.main === 'Rain' || weather.main === 'Drizzle') score -= 70;
        else if (weather.main === 'Thunderstorm') score -= 90;
        else if (weather.main === 'Clouds') score -= 10;
        
        // Wind scoring
        if (windSpeed >= 20) score -= 40; // Very windy
        else if (windSpeed >= 15) score -= 20; // Windy
        
        // Humidity scoring
        if (humidity > 80) score -= 15; // Very humid
        else if (humidity < 30) score -= 10; // Very dry
        
        return Math.max(0, Math.min(100, score));
    }
    
    getActivityRecommendations(weatherData) {
        // Process data directly to avoid infinite loop with analyzeWeatherConditions
        const recommendations = [];
        
        const temp = weatherData.temp || weatherData.main?.temp || 25;
        const windSpeed = weatherData.wind_speed || (weatherData.wind?.speed * 3.6) || 0;
        const weather = weatherData.weather?.[0] || { main: 'Clear' };
        const beachScore = this.calculateBeachSuitability(weatherData);
        
        // Beach activities
        if (beachScore > 70) {
            recommendations.push('beach', 'swimming', 'sunbathing', 'watersports');
        }
        
        // Indoor activities for bad weather
        if (weather.main === 'Rain' || weather.main === 'Thunderstorm') {
            recommendations.push('museums', 'restaurants', 'shopping', 'spa');
        }
        
        // Wind-dependent activities
        if (windSpeed >= 10 && windSpeed < 20) {
            recommendations.push('sailing', 'windsurfing');
        } else if (windSpeed < 10) {
            recommendations.push('paddleboarding', 'kayaking');
        }
        
        // Temperature-based activities
        if (temp >= 30) {
            recommendations.push('shade_activities', 'indoor_cooling');
        }
        
        return recommendations;
    }
    
    getClothingAdvice(weatherData) {
        // Process data directly to avoid infinite loop
        const advice = [];
        const temp = weatherData.temp || weatherData.main?.temp || 25;
        const windSpeed = weatherData.wind_speed || (weatherData.wind?.speed * 3.6) || 0;
        const weather = weatherData.weather?.[0] || { main: 'Clear' };
        
        // Temperature-based clothing
        if (temp >= 30) {
            advice.push('Lagana letnja odeća', 'Šešir i naočare', 'Krema za sunčanje SPF 30+');
        } else if (temp >= 25) {
            advice.push('Kratke rukave', 'Lagane pantalone', 'Krema za sunčanje');
        } else if (temp >= 20) {
            advice.push('Dugih rukava', 'Lagani džemper za veče');
        } else {
            advice.push('Jakna ili džemper', 'Duže pantalone');
        }
        
        // Weather-specific clothing
        if (weather.main === 'Rain' || weather.main === 'Drizzle' || weather.main === 'Thunderstorm') {
            advice.push('Kišobran ili kišna jakna', 'Vodootporna obuća');
        }
        
        if (windSpeed >= 20) {
            advice.push('Vetrovka', 'Odeća koja se ne razvija');
        }
        
        return advice;
    }
    
    getTransportAdvice(weatherData) {
        // Process data directly to avoid infinite loop
        const weather = weatherData.weather?.[0] || { main: 'Clear' };
        const windSpeed = weatherData.wind_speed || (weatherData.wind?.speed * 3.6) || 0;
        
        if (weather.main === 'Rain' || weather.main === 'Thunderstorm') {
            return {
                recommended: 'taxi',
                reason: 'Loše vreme - izbegavaj javni transport',
                alternatives: ['rent_car']
            };
        }
        
        if (windSpeed >= 20) {
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
        // Process data directly to avoid infinite loop
        const scenarios = [];
        const beachScore = this.calculateBeachSuitability(weatherData);
        const weather = weatherData.weather?.[0] || { main: 'Clear' };
        const windSpeed = weatherData.wind_speed || (weatherData.wind?.speed * 3.6) || 0;
        
        // Perfect beach day
        if (beachScore > 80) {
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
        if (beachScore > 60 && windSpeed < 20) {
            scenarios.push({
                id: 'islandLoop',
                priority: 'medium',
                reason: 'Dobro vreme za istraživanje ostrva'
            });
        }
        
        // Romantic weather
        if (weather.main === 'Clear' || weather.main === 'Clouds') {
            scenarios.push({
                id: 'romantic',
                priority: 'medium',
                reason: 'Romantična atmosfera'
            });
        }
        
        // Bad weather - indoor activities
        if (weather.main === 'Rain' || weather.main === 'Thunderstorm') {
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
        // Process data directly to avoid infinite loop
        const temp = weatherData.temp || weatherData.main?.temp || 25;
        const windSpeed = weatherData.wind_speed || (weatherData.wind?.speed * 3.6) || 0;
        const weather = weatherData.weather?.[0] || { main: 'Clear' };
        
        // Temperature alerts
        if (temp >= 30) {
            alerts.push({
                type: 'warning',
                title: '🌡️ Visoka temperatura',
                message: 'Temperatura preko 30°C - ostani hidratisan i traži hlad',
                icon: '🥵'
            });
        }
        
        // Weather alerts
        if (weather.main === 'Rain' || weather.main === 'Drizzle') {
            alerts.push({
                type: 'info',
                title: '🌧️ Kiša',
                message: 'Ponaši kišobran i prilagodi planove',
                icon: '☔'
            });
        }
        
        if (weather.main === 'Thunderstorm') {
            alerts.push({
                type: 'danger',
                title: '⛈️ Nevreme',
                message: 'Izabegavaj outdoor aktivnosti i ostani na sigurnom',
                icon: '⚡'
            });
        }
        
        // Wind alerts
        if (windSpeed >= 20) {
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
        const isValid = WEATHER_CONFIG.apiKey && 
               WEATHER_CONFIG.apiKey !== 'demo_key_replace_with_real' &&
               WEATHER_CONFIG.apiKey.length > 10;
        
        debugLog('API Key validation:', {
            hasKey: !!WEATHER_CONFIG.apiKey,
            keyLength: WEATHER_CONFIG.apiKey?.length,
            isDemoKey: WEATHER_CONFIG.apiKey === 'demo_key_replace_with_real',
            isValid: isValid
        });
        
        return isValid;
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
        try {
            const current = await this.getCurrentWeather();
            const forecast = await this.getWeatherForecast();
            
            // Ensure we have valid data structure
            const weatherData = {
                current: current,
                forecast: forecast,
                analysis: this.analyzeWeatherConditions(current),
                scenarios: this.getWeatherBasedScenarios(current),
                alerts: this.checkWeatherAlerts(current),
                lastUpdate: new Date().toLocaleTimeString('sr-RS', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })
            };
            
            console.log('🌦️ Weather data assembled:', weatherData);
            return weatherData;
            
        } catch (error) {
            console.error('🌦️ Error in getWeatherData:', error);
            
            // Fallback to mock data with analysis
            const mockCurrent = this.mockWeatherData.current;
            return {
                current: mockCurrent,
                forecast: this.mockWeatherData.forecast,
                analysis: this.analyzeWeatherConditions(mockCurrent),
                scenarios: this.getWeatherBasedScenarios(mockCurrent),
                alerts: this.checkWeatherAlerts(mockCurrent),
                lastUpdate: this.mockWeatherData.lastUpdate,
                isMockData: true
            };
        }
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

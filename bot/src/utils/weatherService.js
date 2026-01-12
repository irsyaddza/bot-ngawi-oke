// Weather Service - Open-Meteo API Integration
// No API key required!

const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

// Weather code to emoji and description mapping
const weatherCodes = {
    0: { emoji: '☀️', desc: 'Cerah' },
    1: { emoji: '🌤️', desc: 'Cerah Berawan' },
    2: { emoji: '⛅', desc: 'Berawan Sebagian' },
    3: { emoji: '☁️', desc: 'Berawan' },
    45: { emoji: '🌫️', desc: 'Berkabut' },
    48: { emoji: '🌫️', desc: 'Kabut Tebal' },
    51: { emoji: '🌧️', desc: 'Gerimis Ringan' },
    53: { emoji: '🌧️', desc: 'Gerimis' },
    55: { emoji: '🌧️', desc: 'Gerimis Lebat' },
    61: { emoji: '🌧️', desc: 'Hujan Ringan' },
    63: { emoji: '🌧️', desc: 'Hujan Sedang' },
    65: { emoji: '🌧️', desc: 'Hujan Lebat' },
    71: { emoji: '❄️', desc: 'Salju Ringan' },
    73: { emoji: '❄️', desc: 'Salju Sedang' },
    75: { emoji: '❄️', desc: 'Salju Lebat' },
    80: { emoji: '🌦️', desc: 'Hujan Ringan' },
    81: { emoji: '🌦️', desc: 'Hujan Sedang' },
    82: { emoji: '⛈️', desc: 'Hujan Lebat' },
    95: { emoji: '⛈️', desc: 'Badai Petir' },
    96: { emoji: '⛈️', desc: 'Badai + Hujan Es Ringan' },
    99: { emoji: '⛈️', desc: 'Badai + Hujan Es Lebat' }
};

/**
 * Get coordinates from city name
 */
async function getCoordinates(cityName) {
    const url = `${GEOCODING_API}?name=${encodeURIComponent(cityName)}&count=1&language=id&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return null;
    }

    return {
        name: data.results[0].name,
        latitude: data.results[0].latitude,
        longitude: data.results[0].longitude,
        country: data.results[0].country,
        admin: data.results[0].admin1 || ''
    };
}

/**
 * Get weather data for coordinates
 */
async function getWeatherData(latitude, longitude) {
    const url = `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability&hourly=temperature_2m,weather_code&timezone=Asia/Jakarta&forecast_days=1`;

    const response = await fetch(url);
    const data = await response.json();

    return data;
}

/**
 * Get weather info for a city
 */
async function getWeather(cityName) {
    const location = await getCoordinates(cityName);
    if (!location) {
        return { error: 'Lokasi tidak ditemukan' };
    }

    const weather = await getWeatherData(location.latitude, location.longitude);

    // Get current weather
    const current = weather.current;
    const weatherInfo = weatherCodes[current.weather_code] || { emoji: '🌡️', desc: 'Unknown' };

    // Get hourly forecasts for morning, noon, afternoon, night
    const hourly = weather.hourly;
    const forecasts = {
        pagi: { hour: 6, temp: null, code: null },
        siang: { hour: 12, temp: null, code: null },
        sore: { hour: 17, temp: null, code: null },
        malam: { hour: 21, temp: null, code: null }
    };

    // Find temps for each time of day
    for (let i = 0; i < hourly.time.length; i++) {
        const hour = new Date(hourly.time[i]).getHours();
        if (hour === 6) {
            forecasts.pagi.temp = Math.round(hourly.temperature_2m[i]);
            forecasts.pagi.code = hourly.weather_code[i];
        } else if (hour === 12) {
            forecasts.siang.temp = Math.round(hourly.temperature_2m[i]);
            forecasts.siang.code = hourly.weather_code[i];
        } else if (hour === 17) {
            forecasts.sore.temp = Math.round(hourly.temperature_2m[i]);
            forecasts.sore.code = hourly.weather_code[i];
        } else if (hour === 21) {
            forecasts.malam.temp = Math.round(hourly.temperature_2m[i]);
            forecasts.malam.code = hourly.weather_code[i];
        }
    }

    return {
        location: location,
        current: {
            temp: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            precipitationProbability: current.precipitation_probability || 0,
            weatherCode: current.weather_code,
            ...weatherInfo
        },
        forecasts: forecasts
    };
}

/**
 * Generate weather tips based on conditions
 */
function getWeatherTip(weather) {
    const tips = [];

    if (weather.current.precipitationProbability > 50) {
        tips.push('Jangan lupa bawa payung! ☔');
    }
    if (weather.current.temp > 32) {
        tips.push('Cuaca panas, minum air yang banyak ya! 💧');
    }
    if (weather.current.temp < 20) {
        tips.push('Agak dingin nih, pake jaket! 🧥');
    }
    if (weather.current.humidity > 80) {
        tips.push('Kelembapan tinggi, hati-hati gerah! 💦');
    }
    if (weather.current.windSpeed > 30) {
        tips.push('Angin kencang, hati-hati di jalan! 🌬️');
    }

    if (tips.length === 0) {
        tips.push('Cuaca bagus untuk beraktivitas! 😊');
    }

    return tips[Math.floor(Math.random() * tips.length)];
}

/**
 * Format weather as news anchor style message
 */
function formatWeatherMessage(weather) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const greeting = now.getHours() < 12 ? 'Selamat pagi' :
        now.getHours() < 15 ? 'Selamat siang' :
            now.getHours() < 18 ? 'Selamat sore' : 'Selamat malam';

    const locationName = weather.location.admin ?
        `${weather.location.name}, ${weather.location.admin}` :
        weather.location.name;

    const fc = weather.forecasts;
    const getIcon = (code) => (weatherCodes[code] || { emoji: '🌡️' }).emoji;
    const getDesc = (code) => (weatherCodes[code] || { desc: '...' }).desc;

    return `${weather.current.emoji} **LAPORAN CUACA ${weather.location.name.toUpperCase()}** - ${dateStr}

${greeting} warga ${locationName}! 

🌡️ **Suhu:** ${weather.current.temp}°C (terasa ${weather.current.feelsLike}°C)
💧 **Kelembapan:** ${weather.current.humidity}%
💨 **Angin:** ${weather.current.windSpeed} km/jam
🌧️ **Peluang Hujan:** ${weather.current.precipitationProbability}%
☁️ **Kondisi:** ${weather.current.desc}

📅 **PRAKIRAAN HARI INI:**
• Pagi: ${getIcon(fc.pagi.code)} ${getDesc(fc.pagi.code)} (${fc.pagi.temp}°C)
• Siang: ${getIcon(fc.siang.code)} ${getDesc(fc.siang.code)} (${fc.siang.temp}°C)
• Sore: ${getIcon(fc.sore.code)} ${getDesc(fc.sore.code)} (${fc.sore.temp}°C)
• Malam: ${getIcon(fc.malam.code)} ${getDesc(fc.malam.code)} (${fc.malam.temp}°C)

💡 **Tips:** ${getWeatherTip(weather)}

_Sekian laporan cuaca hari ini. Tetap semangat!_ ⛅`;
}

module.exports = {
    getWeather,
    formatWeatherMessage,
    getCoordinates
};

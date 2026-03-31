import cityConfigs from "../../config/city.json";

const ALERT_CODES = [65, 75, 77, 82, 85, 86, 95, 96, 99];

export default async function handler(req, res) {
  try {
    const cities = Array.isArray(cityConfigs) ? cityConfigs : [cityConfigs];
    const index = parseInt(req.query.index) || 0;
    const cityConfig = cities[index % cities.length];

    // Géocodage
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityConfig.city)}&count=1&language=fr`
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ message: "Ville introuvable dans le fichier de configuration." });
    }

    const { latitude, longitude } = geoData.results[0];

    // Appel météo
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,visibility` +
      `&hourly=temperature_2m,weather_code,precipitation_probability` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max` +
      `&forecast_days=7` +
      `&wind_speed_unit=ms` +
      `&timezone=${encodeURIComponent(cityConfig.timezone)}`
    );
    const weatherData = await weatherRes.json();

    const current = weatherData.current;
    const daily = weatherData.daily;
    const hourly = weatherData.hourly;

    const now = new Date(current.time);
    const sunrise = new Date(daily.sunrise[0]);
    const sunset = new Date(daily.sunset[0]);
    const isDay = now >= sunrise && now < sunset;

    const currentHourIndex = hourly.time.findIndex(t => t >= current.time);
    const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0;
    const hourlyForecast = hourly.time.slice(startIndex, startIndex + 24).map((time, i) => ({
      time,
      temp: hourly.temperature_2m[startIndex + i],
      weather_code: hourly.weather_code[startIndex + i],
      precipitation_probability: hourly.precipitation_probability[startIndex + i],
      icon: wmoToIcon(hourly.weather_code[startIndex + i], true),
      description: wmoToDescription(hourly.weather_code[startIndex + i]),
    }));

    const dailyForecast = daily.time.map((date, i) => ({
      date,
      temp_max: daily.temperature_2m_max[i],
      temp_min: daily.temperature_2m_min[i],
      weather_code: daily.weather_code[i],
      precipitation_probability: daily.precipitation_probability_max[i],
      icon: wmoToIcon(daily.weather_code[i], true),
      description: wmoToDescription(daily.weather_code[i]),
    }));

    const alertCode = current.weather_code;
    const alert = ALERT_CODES.includes(alertCode)
      ? {
          active: true,
          message: `⚠️ Conditions météo sévères : ${wmoToDescription(alertCode)}`,
          level: alertCode >= 95 ? "danger" : "warning",
        }
      : { active: false };

    res.status(200).json({
      name: cityConfig.city,
      sys: {
        country: cityConfig.country,
        sunrise: Math.floor(sunrise.getTime() / 1000),
        sunset: Math.floor(sunset.getTime() / 1000),
      },
      weather: [{ description: wmoToDescription(alertCode), icon: wmoToIcon(alertCode, isDay) }],
      main: {
        temp: current.temperature_2m,
        feels_like: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
      },
      wind: { speed: current.wind_speed_10m, deg: current.wind_direction_10m },
      visibility: current.visibility,
      timezone: weatherData.utc_offset_seconds,
      dt: Math.floor(now.getTime() / 1000),
      hourlyForecast,
      dailyForecast,
      alert,
      totalCities: cities.length,
    });

  } catch (error) {
    console.error("Erreur lors de la récupération météo :", error);
    res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
  }
}

function wmoToIcon(code, isDay) {
  const s = isDay ? "d" : "n";
  if (code === 0 || code === 1) return `01${s}`;
  if (code === 2) return `02${s}`;
  if (code === 3) return `04${s}`;
  if (code === 45 || code === 48) return `50${s}`;
  if ([51, 53, 55].includes(code)) return `09${s}`;
  if ([61, 63, 65].includes(code)) return `10${s}`;
  if ([71, 73, 75, 77].includes(code)) return `13${s}`;
  if ([80, 81, 82].includes(code)) return `09${s}`;
  if ([85, 86].includes(code)) return `13${s}`;
  if ([95, 96, 99].includes(code)) return `11${s}`;
  return `03${s}`;
}

function wmoToDescription(code) {
  const descriptions = {
    0: "Ciel dégagé", 1: "Principalement dégagé", 2: "Partiellement nuageux",
    3: "Couvert", 45: "Brumeux", 48: "Brouillard givrant",
    51: "Bruine légère", 53: "Bruine modérée", 55: "Bruine dense",
    61: "Pluie légère", 63: "Pluie modérée", 65: "Pluie forte",
    71: "Neige légère", 73: "Neige modérée", 75: "Neige forte",
    77: "Grains de neige", 80: "Averses légères", 81: "Averses modérées",
    82: "Averses violentes", 85: "Averses de neige légères", 86: "Averses de neige fortes",
    95: "Orageux", 96: "Orage avec grêle légère", 99: "Orage avec grêle forte",
  };
  return descriptions[code] || "Conditions inconnues";
}
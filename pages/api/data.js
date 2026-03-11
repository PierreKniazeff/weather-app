import cityConfig from "../../config/city.json";

export default async function handler(req, res) {
  const { city, country, timezone } = cityConfig;

  try {
    // ÉTAPE 1 : Géocodage — convertir le nom de ville en coordonnées lat/lon
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr`
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ message: "Ville introuvable dans le fichier de configuration." });
    }

    const { latitude, longitude } = geoData.results[0];

    // ÉTAPE 2 : Appel météo Open-Meteo avec les coordonnées
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,visibility` +
      `&daily=sunrise,sunset` +
      `&wind_speed_unit=ms` +
      `&timezone=${encodeURIComponent(timezone)}`
    );
    const weatherData = await weatherRes.json();

    const current = weatherData.current;
    const daily = weatherData.daily;

    // ÉTAPE 3 : Déterminer si c'est le jour ou la nuit (pour l'icône)
    const now = new Date(current.time);
    const sunrise = new Date(daily.sunrise[0]);
    const sunset = new Date(daily.sunset[0]);
    const isDay = now >= sunrise && now < sunset;

    // ÉTAPE 4 : Construire la réponse au même format qu'attendu par les composants React
    const response = {
      name: city,
      sys: {
        country: country,
        sunrise: Math.floor(sunrise.getTime() / 1000),
        sunset: Math.floor(sunset.getTime() / 1000),
      },
      weather: [
        {
          description: wmoToDescription(current.weather_code),
          icon: wmoToIcon(current.weather_code, isDay),
        },
      ],
      main: {
        temp: current.temperature_2m,
        feels_like: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
      },
      wind: {
        speed: current.wind_speed_10m,
        deg: current.wind_direction_10m,
      },
      visibility: current.visibility,
      timezone: weatherData.utc_offset_seconds,
      dt: Math.floor(now.getTime() / 1000),
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Erreur lors de la récupération météo :", error);
    res.status(500).json({ message: "Erreur serveur. Veuillez réessayer." });
  }
}

// --- Fonctions utilitaires ---

// Mappe un code météo WMO (Open-Meteo) vers un nom d'icône compatible avec les SVG existants du projet
function wmoToIcon(code, isDay) {
  const s = isDay ? "d" : "n";
  if (code === 0 || code === 1)            return `01${s}`; // Ciel clair
  if (code === 2)                           return `02${s}`; // Partiellement nuageux
  if (code === 3)                           return `04${s}`; // Couvert
  if (code === 45 || code === 48)           return `50${s}`; // Brouillard
  if ([51, 53, 55].includes(code))          return `09${s}`; // Bruine
  if ([61, 63, 65].includes(code))          return `10${s}`; // Pluie
  if ([71, 73, 75, 77].includes(code))      return `13${s}`; // Neige
  if ([80, 81, 82].includes(code))          return `09${s}`; // Averses
  if ([85, 86].includes(code))              return `13${s}`; // Averses de neige
  if ([95, 96, 99].includes(code))          return `11${s}`; // Orage
  return `03${s}`;
}

// Retourne une description lisible en français pour chaque code WMO
function wmoToDescription(code) {
  const descriptions = {
    0: "Ciel dégagé",
    1: "Principalement dégagé",
    2: "Partiellement nuageux",
    3: "Couvert",
    45: "Brumeux",
    48: "Brouillard givrant",
    51: "Bruine légère",
    53: "Bruine modérée",
    55: "Bruine dense",
    61: "Pluie légère",
    63: "Pluie modérée",
    65: "Pluie forte",
    71: "Neige légère",
    73: "Neige modérée",
    75: "Neige forte",
    77: "Grains de neige",
    80: "Averses légères",
    81: "Averses modérées",
    82: "Averses violentes",
    85: "Averses de neige légères",
    86: "Averses de neige fortes",
    95: "Orageux",
    96: "Orage avec grêle légère",
    99: "Orage avec grêle forte",
  };
  return descriptions[code] || "Conditions inconnues";
}

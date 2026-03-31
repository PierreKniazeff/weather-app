import styles from "./ForecastHourly.module.css";

export const ForecastHourly = ({ hourlyForecast, unitSystem }) => {
  if (!hourlyForecast || hourlyForecast.length === 0) return null;

  const unit = unitSystem === "metric" ? "°C" : "°F";

  const convertTemp = (temp) => {
    if (unitSystem === "imperial") return Math.round((temp * 9) / 5 + 32);
    return Math.round(temp);
  };

  const formatHour = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Prévisions heure par heure — 24h</h3>
      <div className={styles.scroll}>
        {hourlyForecast.map((hour, i) => (
          <div key={i} className={`${styles.hourCard} ${i === 0 ? styles.current : ""}`}>
            <span className={styles.time}>{i === 0 ? "Maintenant" : formatHour(hour.time)}</span>
            <img
              src={`/icons/${hour.icon}.svg`}
              alt={hour.description}
              className={styles.icon}
            />
            <span className={styles.temp}>{convertTemp(hour.temp)}{unit}</span>
            {hour.precipitation_probability > 0 && (
              <span className={styles.precip}>💧 {hour.precipitation_probability}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
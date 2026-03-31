import styles from "./ForecastDaily.module.css";

export const ForecastDaily = ({ dailyForecast, unitSystem }) => {
  if (!dailyForecast || dailyForecast.length === 0) return null;

  const unit = unitSystem === "metric" ? "°C" : "°F";

  const convertTemp = (temp) => {
    if (unitSystem === "imperial") return Math.round((temp * 9) / 5 + 32);
    return Math.round(temp);
  };

  const formatDay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Prévisions 7 jours</h3>
      <div className={styles.grid}>
        {dailyForecast.map((day, i) => (
          <div key={i} className={styles.dayCard}>
            <span className={styles.date}>{i === 0 ? "Aujourd'hui" : formatDay(day.date)}</span>
            <img
              src={`/icons/${day.icon}.svg`}
              alt={day.description}
              className={styles.icon}
            />
            <span className={styles.description}>{day.description}</span>
            <div className={styles.temps}>
              <span className={styles.tempMax}>{convertTemp(day.temp_max)}{unit}</span>
              <span className={styles.tempMin}>{convertTemp(day.temp_min)}{unit}</span>
            </div>
            {day.precipitation_probability > 0 && (
              <span className={styles.precip}>💧 {day.precipitation_probability}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
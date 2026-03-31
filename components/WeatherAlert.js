import styles from "./WeatherAlert.module.css";

export const WeatherAlert = ({ alert }) => {
  if (!alert || !alert.active) return null;

  return (
    <div className={`${styles.alert} ${styles[alert.level]}`}>
      <span className={styles.icon}>
        {alert.level === "danger" ? "🔴" : "🟡"}
      </span>
      <span className={styles.message}>{alert.message}</span>
    </div>
  );
};
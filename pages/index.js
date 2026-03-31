import { useState, useEffect } from "react";
import { MainCard } from "../components/MainCard";
import { ContentBox } from "../components/ContentBox";
import { Header } from "../components/Header";
import { DateAndTime } from "../components/DateAndTime";
import { MetricsBox } from "../components/MetricsBox";
import { UnitSwitch } from "../components/UnitSwitch";
import { LoadingScreen } from "../components/LoadingScreen";
import { ErrorScreen } from "../components/ErrorScreen";
import { WeatherAlert } from "../components/WeatherAlert";
import { ForecastHourly } from "../components/ForecastHourly";
import { ForecastDaily } from "../components/ForecastDaily";
import styles from "../styles/Home.module.css";

// Rafraîchissement des données toutes les heures (en millisecondes)
const REFRESH_INTERVAL = 60 * 60 * 1000;

export const App = () => {
  const [weatherData, setWeatherData] = useState();
  const [unitSystem, setUnitSystem] = useState("metric");

  const getData = async () => {
    const res = await fetch("api/data");
    const data = await res.json();
    setWeatherData({ ...data });
  };

  useEffect(() => {
    // Chargement initial des données
    getData();

    // Rafraîchissement automatique toutes les heures
    const interval = setInterval(() => {
      getData();
    }, REFRESH_INTERVAL);

    // Nettoyage du timer quand le composant est démonté
    return () => clearInterval(interval);
  }, []);

  const changeSystem = () =>
    unitSystem === "metric"
      ? setUnitSystem("imperial")
      : setUnitSystem("metric");

return weatherData && !weatherData.message ? (
    <div className={styles.wrapper}>
      <WeatherAlert alert={weatherData.alert} />
      <MainCard
        city={weatherData.name}
        country={weatherData.sys.country}
        description={weatherData.weather[0].description}
        iconName={weatherData.weather[0].icon}
        unitSystem={unitSystem}
        weatherData={weatherData}
      />
      <ContentBox>
        <Header>
          <DateAndTime weatherData={weatherData} unitSystem={unitSystem} />
          <UnitSwitch onClick={changeSystem} unitSystem={unitSystem} />
        </Header>
        <MetricsBox weatherData={weatherData} unitSystem={unitSystem} />
      </ContentBox>
      <div style={{ gridColumn: "1 / -1", padding: "0 30px 30px" }}>
        <ForecastHourly
          hourlyForecast={weatherData.hourlyForecast}
          unitSystem={unitSystem}
        />
        <ForecastDaily
          dailyForecast={weatherData.dailyForecast}
          unitSystem={unitSystem}
        />
      </div>
    </div>
  ) : weatherData && weatherData.message ? (
    <ErrorScreen errorMessage={weatherData.message} />
  ) : (
    <LoadingScreen />
  );
};

export default App;
import { useState, useEffect, useRef } from "react";
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

const REFRESH_INTERVAL = 60 * 60 * 1000;      // Rafraîchissement météo : 1h
const CITY_ROTATION_INTERVAL = 5 * 1000;     // Rotation des villes : 30 secondes

export const App = () => {
  const [weatherData, setWeatherData] = useState();
  const [unitSystem, setUnitSystem] = useState("metric");
  const [cityIndex, setCityIndex] = useState(0);
  const totalCities = useRef(1);

  const getData = async (index) => {
    const res = await fetch(`api/data?index=${index}`);
    const data = await res.json();
    if (data.totalCities) totalCities.current = data.totalCities;
    setWeatherData({ ...data });
  };

  // Chargement initial + rafraîchissement horaire
  useEffect(() => {
    getData(0);
    const refreshInterval = setInterval(() => {
      getData(cityIndex);
    }, REFRESH_INTERVAL);
    return () => clearInterval(refreshInterval);
  }, []);

  // Rotation automatique des villes toutes les 30 secondes
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setCityIndex(prev => {
        const next = (prev + 1) % totalCities.current;
        getData(next);
        return next;
      });
    }, CITY_ROTATION_INTERVAL);
    return () => clearInterval(rotationInterval);
  }, []);

  const changeSystem = () =>
    unitSystem === "metric" ? setUnitSystem("imperial") : setUnitSystem("metric");

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
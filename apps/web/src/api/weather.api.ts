import axios from "axios";
import { useWeatherStore } from "@/store/weather.store";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

/**
 * fetchWeatherByCity — 도시별 날씨 호출
 * @param cityName 도시 영문명 (예: "Ho Chi Minh City")
 */
export async function fetchWeatherByCity(cityName: string) {
  const cached = useWeatherStore.getState().getWeather(cityName);
  if (cached) return cached;

  const { data } = await axios.get(BASE_URL, {
    params: {
      q: cityName,
      appid: API_KEY,
      units: "metric",
      lang: "kr",
    },
  });

  const payload = {
    city: cityName,
    temp: data.main.temp,
    humidity: data.main.humidity,
    wind: data.wind.speed,
    description: data.weather[0]?.description,
    icon: data.weather[0]?.icon,
    updatedAt: new Date().toISOString(),
  };

  useWeatherStore.getState().setWeather(cityName, payload);
  return payload;
}

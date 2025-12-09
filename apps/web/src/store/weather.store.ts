import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WeatherData {
  city: string;
  temp: number;
  humidity: number;
  wind: number;
  description: string;
  icon: string;
  updatedAt: string;
}

interface WeatherStore {
  cache: Record<string, WeatherData>;
  setWeather: (city: string, data: WeatherData) => void;
  getWeather: (city: string) => WeatherData | null;
  clearCache: () => void;
}

/**
 * 도시별 날씨 캐시 저장소 (Zustand + persist)
 * - fetch 호출 최소화
 * - 도시별 최근 30분 캐싱
 */
export const useWeatherStore = create<WeatherStore>()(
  persist(
    (set, get) => ({
      cache: {},

      setWeather: (city, data) =>
        set((state) => ({
          cache: { ...state.cache, [city]: data },
        })),

      getWeather: (city) => {
        const record = get().cache[city];
        if (!record) return null;

        const diff =
          Date.now() - new Date(record.updatedAt).getTime();
        if (diff > 1000 * 60 * 30) return null; // 30분 이상 → 무효
        return record;
      },

      clearCache: () => set({ cache: {} }),
    }),
    {
      name: "weather-cache-store",
    }
  )
);

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaTemperatureHigh, FaWind, FaTint } from "react-icons/fa";
import { FiClock } from "react-icons/fi";

import { fetchWeather } from "@/api/widgets.api";

const WidgetSkeleton = () => (
  <div className="animate-pulse rounded-3xl bg-background-sub p-6 shadow-lg shadow-black/5 ring-1 ring-border/60">
    <div className="h-5 w-32 rounded-full bg-black/10" />
    <div className="mt-6 flex items-center gap-4">
      <div className="h-16 w-16 rounded-full bg-black/10" />
      <div className="h-12 w-24 rounded-full bg-black/10" />
    </div>
    <div className="mt-6 space-y-3">
      <div className="h-3 w-4/5 rounded-full bg-black/10" />
      <div className="h-3 w-3/5 rounded-full bg-black/10" />
      <div className="h-3 w-2/5 rounded-full bg-black/10" />
    </div>
  </div>
);

const WeatherWidget = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["weather", "Ho Chi Minh City"],
    queryFn: () => fetchWeather("Ho Chi Minh City"),
    staleTime: 1000 * 60 * 30,
  });

  const updatedAt = useMemo(() => {
    if (!data?.updatedAt) return null;
    const date = new Date(data.updatedAt);
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, [data?.updatedAt]);

  if (isLoading) return <WidgetSkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-3xl bg-red-50 p-6 text-sm font-medium text-red-700 shadow-lg ring-1 ring-red-200">
        현재 날씨 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
      </div>
    );
  }

  const condition = data.weather[0];

  return (
    <section
      aria-label="오늘의 호치민 날씨"
      className="rounded-3xl bg-background-sub p-6 shadow-lg shadow-black/5 ring-1 ring-border/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Today's Weather
          </p>
          <h3 className="mt-1 text-[20px] font-bold leading-snug text-text-main">
            호치민 현재 기상
          </h3>
        </div>
        {condition?.icon && (
          <img
            src={`https://openweathermap.org/img/wn/${condition.icon}@2x.png`}
            alt={condition.description}
            className="h-14 w-14"
            loading="lazy"
          />
        )}
      </div>

      <div className="mt-6 flex items-end gap-4">
        <p className="text-5xl font-bold leading-none text-text-main">
          {Math.round(data.main.temp)}°C
        </p>
        <div className="space-y-1 text-sm text-text-secondary">
          <p className="capitalize">{condition?.description}</p>
          <p className="flex items-center gap-2">
            <FiClock aria-hidden className="text-base" />
            {updatedAt ? `${updatedAt} 기준` : "실시간 업데이트"}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-3 text-sm text-text-secondary sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-2xl bg-background px-3 py-3">
          <FaTemperatureHigh className="text-lg text-primary" aria-hidden />
          <div>
            <dt className="text-xs uppercase tracking-wide">체감</dt>
            <dd className="text-base font-semibold text-text-main">
              {Math.round(data.main.feels_like)}°C
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-background px-3 py-3">
          <FaTint className="text-lg text-primary" aria-hidden />
          <div>
            <dt className="text-xs uppercase tracking-wide">습도</dt>
            <dd className="text-base font-semibold text-text-main">
              {data.main.humidity}%
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-background px-3 py-3">
          <FaWind className="text-lg text-primary" aria-hidden />
          <div>
            <dt className="text-xs uppercase tracking-wide">풍속</dt>
            <dd className="text-base font-semibold text-text-main">
              {data.wind.speed} m/s
            </dd>
          </div>
        </div>
      </dl>
    </section>
  );
};

export default WeatherWidget;

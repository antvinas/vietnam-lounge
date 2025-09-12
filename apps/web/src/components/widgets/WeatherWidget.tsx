import { useQuery } from 'react-query';
import { fetchWeather } from '../../api/widgets.api';
import { FaTemperatureHigh, FaWind, FaTint } from 'react-icons/fa';

const WeatherWidget = () => {
  const { data: weather, isLoading, isError } = useQuery('weather', fetchWeather, {
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const WidgetSkeleton = () => (
    <div className="w-full max-w-sm p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 w-3/4 rounded mb-4"></div>
        <div className="flex justify-between items-center">
            <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-700 w-1/4 rounded"></div>
        </div>
        <div className="mt-4 space-y-3">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 w-1/2 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 w-5/6 rounded"></div>
        </div>
    </div>
  );

  if (isLoading) return <WidgetSkeleton />;
  if (isError) return <div className="w-full max-w-sm p-6 bg-red-100 text-red-700 rounded-lg shadow-md">Failed to load weather data.</div>;

  return (
    <div className="w-full max-w-sm p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Weather in {weather?.name}</h3>
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center">
          {weather?.weather[0]?.icon && (
            <img 
              src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} 
              alt={weather.weather[0].description} 
              className="w-16 h-16"
            />
          )}
          <p className="text-5xl font-bold text-gray-900 dark:text-white">{weather?.main.temp.toFixed(0)}°C</p>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 capitalize">{weather?.weather[0].description}</p>
      </div>
      <div className="mt-6 space-y-2 text-gray-700 dark:text-gray-300">
          <div className="flex items-center"><FaTemperatureHigh className="mr-2 text-primary" /> Feels like: {weather?.main.feels_like.toFixed(0)}°C</div>
          <div className="flex items-center"><FaTint className="mr-2 text-primary" /> Humidity: {weather?.main.humidity}%</div>
          <div className="flex items-center"><FaWind className="mr-2 text-primary" /> Wind: {weather?.wind.speed} m/s</div>
      </div>
    </div>
  );
};

export default WeatherWidget;


import { useQuery } from 'react-query';
import { fetchExchangeRates } from '../../api/widgets.api';

const ExchangeTicker = () => {
  const { data, isLoading, isError } = useQuery('exchangeRates', fetchExchangeRates, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5,
  });

  if (isLoading || isError || !data) {
    return <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-full"></div>;
  }

  const vndRate = data.rates.VND.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const krwRate = data.rates.KRW.toLocaleString('en-US', { maximumFractionDigits: 2 });

  return (
    <div className="bg-gray-100 dark:bg-gray-800 py-2 px-4 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 overflow-hidden whitespace-nowrap">
        <span>USD/VND: {vndRate}</span>
        <span className="mx-4">|</span>
        <span>USD/KRW: {krwRate}</span>
    </div>
  );
};

export default ExchangeTicker;

import { useState } from 'react';
import { useQuery } from 'react-query';
import { fetchExchangeRates } from '../../api/widgets.api';
import { FaDollarSign, FaYenSign } from 'react-icons/fa'; // Using Yen sign for VND for visual purposes
import { FaK } from "react-icons/fa6";

const ExchangeRateWidget = () => {
  const [amount, setAmount] = useState(1);
  const { data: exchangeRates, isLoading, isError } = useQuery('exchangeRates', fetchExchangeRates, {
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const vndRate = exchangeRates?.rates.VND || 25000;
  const krwRate = exchangeRates?.rates.KRW || 1300;

  const WidgetSkeleton = () => (
    <div className="w-full max-w-sm p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 w-1/2 rounded mb-4"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-700 w-full rounded mb-4"></div>
        <div className="space-y-3">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
    </div>
  );

  if (isLoading) return <WidgetSkeleton />;
  if (isError) return <div className="w-full max-w-sm p-6 bg-red-100 text-red-700 rounded-lg shadow-md">Failed to load exchange rates.</div>;

  return (
    <div className="w-full max-w-sm p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Currency Converter</h3>
      
      <div className="relative mb-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <FaDollarSign className="text-gray-400" />
        </div>
        <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="input-field pl-10 w-full"
            placeholder="Enter amount in USD"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center">
            <FaYenSign className="text-2xl text-green-500 mr-3" />
            <span className="font-bold text-lg dark:text-white">VND</span>
          </div>
          <span className="text-lg font-mono dark:text-gray-200">{(amount * vndRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center">
            <FaK className="text-2xl text-blue-500 mr-3" />
            <span className="font-bold text-lg dark:text-white">KRW</span>
          </div>
          <span className="text-lg font-mono dark:text-gray-200">{(amount * krwRate).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

       <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">Based on 1 USD = {vndRate.toLocaleString()} VND</p>
    </div>
  );
};

export default ExchangeRateWidget;

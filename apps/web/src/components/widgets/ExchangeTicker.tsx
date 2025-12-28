import { useQuery } from "@tanstack/react-query";
import { fetchExchangeRates } from "@/api/widgets.api";

const ExchangeTicker = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["exchangeRates", "ticker"],
    queryFn: fetchExchangeRates,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });

  if (isLoading || isError || !data) {
    return (
      <div className="h-6 w-full animate-pulse rounded-full bg-black/10" />
    );
  }

  const { rates } = data;
  const vndRate = rates.VND.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
  const krwRate = rates.KRW.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });

  return (
    <div className="overflow-hidden whitespace-nowrap rounded-full bg-background-sub px-4 py-2 text-sm font-medium text-text-secondary shadow-sm ring-1 ring-border/60">
      <span>USD/VND: {vndRate}</span>
      <span className="mx-4 text-text-secondary/60">|</span>
      <span>USD/KRW: {krwRate}</span>
    </div>
  );
};

export default ExchangeTicker;

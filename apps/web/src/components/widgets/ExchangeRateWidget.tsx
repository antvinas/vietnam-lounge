import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaDollarSign, FaYenSign } from "react-icons/fa";
import { FaK } from "react-icons/fa6";
import { FiRefreshCw } from "react-icons/fi";

import { fetchExchangeRates } from "@/api/widgets.api";

const WidgetSkeleton = () => (
  <div className="animate-pulse rounded-3xl bg-background-sub p-6 shadow-lg shadow-black/5 ring-1 ring-border/60">
    <div className="h-5 w-40 rounded-full bg-black/10" />
    <div className="mt-4 h-11 w-full rounded-2xl bg-black/10" />
    <div className="mt-5 space-y-3">
      <div className="h-10 rounded-2xl bg-black/10" />
      <div className="h-10 rounded-2xl bg-black/10" />
    </div>
  </div>
);

const ExchangeRateWidget = () => {
  const [amount, setAmount] = useState(1000); // 원화 입력값
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["exchangeRates"],
    queryFn: fetchExchangeRates,
    staleTime: 1000 * 60 * 60,
  });

  const rates = data?.rates;

  const converted = useMemo(() => {
    if (!rates) {
      return { usd: 0, vnd: 0 };
    }

    return {
      usd: amount / rates.KRW, // KRW → USD
      vnd: (amount / rates.KRW) * rates.VND, // KRW → USD → VND
    };
  }, [amount, rates]);

  const formattedAmount = useMemo(
    () => amount.toLocaleString("en-US"),
    [amount]
  );

  if (isLoading) {
    return <WidgetSkeleton />;
  }

  if (isError || !data || !rates) {
    return (
      <div className="rounded-3xl bg-red-50 p-6 text-sm font-medium text-red-700 shadow-lg ring-1 ring-red-200">
        환율 정보를 불러올 수 없습니다. 네트워크를 확인한 뒤 다시 시도해주세요.
      </div>
    );
  }

  const updatedAt = new Date(data.updatedAt);
  const formattedUpdatedAt = new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(updatedAt);

  return (
    <section
      aria-label="실시간 환율 변환"
      className="rounded-3xl bg-background-sub p-6 shadow-lg shadow-black/5 ring-1 ring-border/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Currency</p>
          <h3 className="mt-1 text-[22px] font-bold leading-snug text-text-main">KRW 실시간 환율</h3>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-transparent hover:bg-primary/10 hover:text-primary"
          aria-label="환율 새로고침"
        >
          <FiRefreshCw className={isFetching ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="mt-6">
        <label
          htmlFor="krwAmount"
          className="text-xs font-medium uppercase tracking-wide text-text-secondary"
        >
          원화 금액 입력
        </label>
        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
          <FaK className="text-lg text-primary" aria-hidden />
          <input
            id="krwAmount"
            type="text"
            inputMode="numeric"
            value={formattedAmount}
            onChange={(event) => {
              const raw = event.target.value.replace(/,/g, "");
              setAmount(Number(raw) || 0);
            }}
            className="w-full bg-transparent text-lg font-semibold text-text-main outline-none"
            aria-describedby="currency-helper"
          />
        </div>
        <p id="currency-helper" className="mt-1 text-xs text-text-secondary">
          1 USD = {rates.KRW.toLocaleString("en-US", { maximumFractionDigits: 2 })} KRW ·{" "}
          {rates.VND.toLocaleString("en-US", { maximumFractionDigits: 0 })} VND
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-background px-4 py-4">
          <div className="flex items-center gap-3">
            <FaDollarSign className="text-2xl text-[#2BB6C5]" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">미국 달러 (USD)</p>
              <p className="text-lg font-semibold text-text-main">
                {converted.usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-background px-4 py-4">
          <div className="flex items-center gap-3">
            <FaYenSign className="text-2xl text-[#8B5CF6]" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">베트남 동 (VND)</p>
              <p className="text-lg font-semibold text-text-main">
                {converted.vnd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-text-secondary">업데이트 기준: {formattedUpdatedAt}</p>
    </section>
  );
};

export default ExchangeRateWidget;

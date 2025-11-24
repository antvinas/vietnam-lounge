import React, { useMemo, useState } from "react";
import useDistanceMatrix, { KmMin } from "@/hooks/useDistanceMatrix";
import { estimateFare, type FareVehicle, formatFare } from "@/services/fare";

type LatLng = { lat: number; lng: number };
type TravelTab = "car" | "walk" | "transit" | "bike";

export interface DestinationLike {
  name: string;
  lat: number;
  lng: number;
  placeId?: string;
}

type Props = {
  open: boolean;
  onClose: () => void;
  origin: LatLng | string;
  destination: DestinationLike;
  /** 도시 키. 예: 'hanoi' */
  city: string;
  /** 확정 시 상위 타임라인에 반영 */
  onConfirm?: (mode: TravelTab, summary: { distanceKm: number; etaMin: number; fareLow?: number; fareHigh?: number }) => void;
  className?: string;
};

/** 모달 외곽 */
const Shell: React.FC<React.PropsWithChildren<{ onClose: () => void; className?: string; open: boolean }>> = ({
  open,
  onClose,
  className,
  children,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="닫기 배경" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="이동수단 선택"
        className={`relative w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-xl p-4 ${className ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
};

export default function TransportPickerModal({ open, onClose, origin, destination, city, onConfirm, className }: Props) {
  const [tab, setTab] = useState<TravelTab>("car");
  const o = useMemo(() => [origin], [origin]);
  const d = useMemo(() => [{ lat: destination.lat, lng: destination.lng }], [destination.lat, destination.lng]);
  const now = useMemo(() => new Date(), []);

  // 거리/ETA 계산. 교통 반영: 자동차·대중교통에 departureTime 지정.
  const dmCar = useDistanceMatrix({ origins: o, destinations: d, mode: "DRIVING", departureTime: now });
  const dmWalk = useDistanceMatrix({ origins: o, destinations: d, mode: "WALKING" });
  const dmTransit = useDistanceMatrix({ origins: o, destinations: d, mode: "TRANSIT", departureTime: now });

  const pick = (x?: KmMin | null) => ({
    km: x?.distanceKm ?? 0,
    min: x?.durationMin ?? 0,
  });

  const car = pick(dmCar.single);
  const walk = pick(dmWalk.single);
  const transit = pick(dmTransit.single);

  // 오토바이 ETA는 자동차 근사치. 라벨에 베타 안내.
  const bike = { km: car.km, min: Math.max(1, Math.round(car.min * 0.9)) };

  // 요금 추정: 자동차/오토바이만 계산
  const carFare = car.km > 0 ? estimateFare(city, "car", car.km, car.min) : undefined;
  const bikeFare = bike.km > 0 ? estimateFare(city, "bike", bike.km, bike.min) : undefined;

  const tabs: Array<{ key: TravelTab; label: string; eta: number; km: number; fare?: { low: number; high: number }; note?: string }> = [
    { key: "car", label: "자동차", eta: car.min, km: car.km, fare: carFare },
    { key: "walk", label: "도보", eta: walk.min, km: walk.km },
    { key: "transit", label: "대중교통", eta: transit.min, km: transit.km },
    { key: "bike", label: "오토바이", eta: bike.min, km: bike.km, fare: bikeFare, note: "자동차 ETA 근사(베타)" },
  ];

  const active = tabs.find((t) => t.key === tab)!;

  const confirm = () => {
    onConfirm?.(tab, {
      distanceKm: active.km,
      etaMin: active.eta,
      fareLow: active.fare?.low,
      fareHigh: active.fare?.high,
    });
    onClose();
  };

  return (
    <Shell open={open} onClose={onClose} className={className}>
      <header className="mb-2">
        <h2 className="text-lg font-semibold">이동수단 선택</h2>
        <p className="text-xs text-slate-500">
          출발지에서 <strong>{destination.name}</strong>까지의 예상치. 교통 반영은 자동차·대중교통만 가능하다.
        </p>
      </header>

      <nav className="mb-3 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`rounded-full px-3 py-1.5 text-sm border ${tab === t.key ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className="rounded-xl border p-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
            <div className="text-slate-500">거리</div>
            <div className="text-lg font-semibold">{active.km > 0 ? `${active.km.toFixed(1)} km` : "-"}</div>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
            <div className="text-slate-500">ETA</div>
            <div className="text-lg font-semibold">{active.eta > 0 ? `${active.eta} 분` : "-"}</div>
          </div>
          {(active.key === "car" || active.key === "bike") && (
            <div className="col-span-2 rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
              <div className="text-slate-500">예상요금</div>
              <div className="text-lg font-semibold">
                {active.fare ? `${formatFare(active.fare.low)} ~ ${formatFare(active.fare.high)}` : "-"}
              </div>
            </div>
          )}
        </div>
        {active.note && <p className="mt-2 text-xs text-slate-500">{active.note}</p>}
      </section>

      <footer className="mt-3 flex justify-end gap-2">
        <button className="rounded-xl border px-3 py-1.5 text-sm" onClick={onClose}>
          취소
        </button>
        <button className="rounded-xl bg-emerald-600 text-white px-3 py-1.5 text-sm" onClick={confirm}>
          타임라인에 반영
        </button>
      </footer>
    </Shell>
  );
}

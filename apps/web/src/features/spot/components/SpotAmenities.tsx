// apps/web/src/components/spots/SpotAmenities.tsx
import React from "react";
import {
  FiWifi,
  FiTruck,
  FiShoppingBag,
  FiPhone,
  FiGlobe,
  FiCreditCard,
  FiMapPin,
  FiUsers,
  FiCoffee,
  FiSun,
  FiMoon,
  FiCheckCircle,
  FiInfo,
} from "react-icons/fi";
import { FaParking, FaLeaf, FaWineGlass } from "react-icons/fa";

type Props = {
  amenities?: string[];
  category?: string;
  className?: string;
  onSuggestInfo?: () => void;
};

const ICONS: Record<string, JSX.Element> = {
  wifi: <FiWifi />,
  "free wifi": <FiWifi />,
  와이파이: <FiWifi />,
  delivery: <FiTruck />,
  배달: <FiTruck />,
  takeout: <FiShoppingBag />,
  포장: <FiShoppingBag />,
  vegetarian: <FaLeaf />,
  비건: <FaLeaf />,
  "vegan options": <FaLeaf />,
  phone: <FiPhone />,
  전화예약: <FiPhone />,
  reservation: <FiPhone />,
  "online booking": <FiGlobe />,
  booking: <FiGlobe />,
  website: <FiGlobe />,
  card: <FiCreditCard />,
  "credit card": <FiCreditCard />,
  "cash only": <FiCreditCard />,
  parking: <FaParking />,
  주차: <FaParking />,
  "valet parking": <FaParking />,
  kids: <FiUsers />,
  "family friendly": <FiUsers />,
  terrace: <FiSun />,
  "outdoor seating": <FiSun />,
  indoor: <FiMoon />,
  coffee: <FiCoffee />,
  alcohol: <FaWineGlass />,
  bar: <FaWineGlass />,
  pub: <FaWineGlass />,
  nightclub: <FaWineGlass />,
  location: <FiMapPin />,
};

const LABELS: Record<string, string> = {
  wifi: "와이파이",
  "free wifi": "무료 와이파이",
  와이파이: "와이파이",
  delivery: "배달",
  배달: "배달",
  takeout: "포장",
  포장: "포장",
  vegetarian: "채식 옵션",
  비건: "비건 옵션",
  "vegan options": "비건 옵션",
  reservation: "예약 가능",
  전화예약: "전화 예약",
  booking: "온라인 예약",
  "online booking": "온라인 예약",
  website: "웹사이트",
  card: "카드 결제",
  "credit card": "카드 결제",
  "cash only": "현금 결제",
  parking: "주차",
  주차: "주차",
  "valet parking": "발레파킹",
  kids: "가족 친화",
  "family friendly": "가족 친화",
  terrace: "야외 좌석",
  "outdoor seating": "야외 좌석",
  indoor: "실내 좌석",
  coffee: "커피",
  alcohol: "주류 제공",
  bar: "바",
  pub: "펍",
  nightclub: "나이트",
  location: "중심가 입지",
};

const DEFAULT_BY_CATEGORY: Record<string, string[]> = {
  restaurant: ["reservation", "card", "wifi", "takeout", "delivery", "alcohol", "parking"],
  cafe: ["wifi", "coffee", "card", "outdoor seating"],
  bar: ["alcohol", "wifi", "card", "parking"],
  hotel: ["wifi", "parking", "online booking", "family friendly"],
};

function normalizeKey(v: string) {
  return v.toLowerCase().trim().replace(/[\s_-]+/g, " ");
}

function toItems(amens: string[]): Array<{ key: string; label: string; icon?: JSX.Element }> {
  const seen = new Set<string>();
  const out: Array<{ key: string; label: string; icon?: JSX.Element }> = [];
  for (const raw of amens) {
    if (!raw) continue;
    const key = normalizeKey(String(raw));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ key, label: LABELS[key] ?? raw, icon: ICONS[key] });
  }
  return out;
}

export default function SpotAmenities({ amenities = [], category, className = "", onSuggestInfo }: Props) {
  const base =
    amenities.length > 0 ? amenities : DEFAULT_BY_CATEGORY[(category || "").toLowerCase()] || [];
  const items = toItems(base);

  if (items.length === 0) {
    return (
      <section className={`rounded-2xl border border-slate-700 bg-slate-800/40 p-4 ${className}`}>
        <h3 className="mb-2 text-base font-semibold text-slate-100">서비스 및 옵션</h3>
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-300">등록된 서비스 정보가 없습니다.</p>
          {onSuggestInfo && (
            <button
              onClick={onSuggestInfo}
              className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-700/40"
            >
              <FiInfo className="opacity-80" /> 정보 제보
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={`rounded-2xl border border-slate-700 bg-slate-800/40 p-4 ${className}`}>
      <h3 className="mb-3 text-base font-semibold text-slate-100">서비스 및 옵션</h3>
      <ul className="flex flex-wrap gap-2">
        {items.map((it) => (
          <li key={it.key}>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-900/40 px-3 py-1 text-xs font-semibold text-slate-100">
              {it.icon ?? <FiCheckCircle className="opacity-80" />}
              {it.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

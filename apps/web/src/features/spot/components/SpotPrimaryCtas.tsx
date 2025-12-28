// src/features/spot/components/SpotPrimaryCtas.tsx
import React from "react";
import { FaPhoneAlt, FaGlobe, FaCalendarCheck, FaMapMarkedAlt, FaInstagram, FaFacebook } from "react-icons/fa";

type Props = {
  phone?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  lat?: number;
  lng?: number;
  spotName?: string;
  mapProvider?: "google" | "apple" | "osm";
  className?: string;
  // ✅ SNS 링크 추가
  socialLinks?: {
    instagram?: string;
    facebook?: string;
  };
  onAction?: (action: "phone" | "website" | "booking" | "directions" | "instagram" | "facebook") => void;
};

function buildDirectionsUrl(
  provider: Props["mapProvider"],
  lat?: number,
  lng?: number,
  label?: string
) {
  if (!lat || !lng) return undefined;
  const q = encodeURIComponent(label ?? `${lat},${lng}`);
  switch (provider) {
    case "apple": return `https://maps.apple.com/?daddr=${lat},${lng}&q=${q}`;
    case "osm":   return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${lat}%2C${lng}`;
    default:      return `http://googleusercontent.com/maps.google.com/maps?daddr=${lat},${lng}`;
  }
}

export default function SpotPrimaryCtas({
  phone, websiteUrl, bookingUrl, lat, lng, spotName,
  mapProvider = "google", className = "", socialLinks, onAction,
}: Props) {
  
  // 버튼 데이터 정의
  const actions = [
    // 1. 전화
    phone && { 
      key: "phone", 
      label: "전화", 
      href: `tel:${phone}`, 
      icon: <FaPhoneAlt />,
      color: "bg-green-50 text-green-600 hover:bg-green-100 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
    },
    // 2. 예약
    bookingUrl && { 
      key: "booking", 
      label: "예약", 
      href: bookingUrl, 
      icon: <FaCalendarCheck />,
      color: "bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
    },
    // 3. 웹사이트
    websiteUrl && { 
      key: "website", 
      label: "웹사이트", 
      href: websiteUrl, 
      icon: <FaGlobe />,
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
    },
    // 4. ✅ Instagram
    socialLinks?.instagram && {
      key: "instagram",
      label: "Instagram",
      href: socialLinks.instagram,
      icon: <FaInstagram />,
      color: "bg-pink-50 text-pink-600 hover:bg-pink-100 border-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800"
    },
    // 5. ✅ Facebook
    socialLinks?.facebook && {
      key: "facebook",
      label: "Facebook",
      href: socialLinks.facebook,
      icon: <FaFacebook />,
      color: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800"
    },
    // 6. 길찾기
    buildDirectionsUrl(mapProvider, lat, lng, spotName) && {
      key: "directions", 
      label: "길찾기",
      href: buildDirectionsUrl(mapProvider, lat, lng, spotName), 
      icon: <FaMapMarkedAlt />,
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    },
  ].filter(Boolean) as Array<{
    key: "phone"|"website"|"booking"|"directions"|"instagram"|"facebook";
    label: string;
    href: string;
    icon: React.ReactNode;
    color: string;
  }>;

  if (!actions.length) return null;

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {actions.map(a => (
        <a
          key={a.key}
          href={a.href}
          target={a.key === "phone" ? "_self" : "_blank"}
          rel="noopener noreferrer"
          onClick={() => onAction?.(a.key)}
          className={`
            flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold border transition-all active:scale-95
            ${a.color}
          `}
          aria-label={a.label}
        >
          {a.icon}
          <span>{a.label}</span>
        </a>
      ))}
    </div>
  );
}
// src/components/seo/SpotSeo.tsx
import React, { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import type { Spot, SpotOpeningHours } from "@/types/spot";

type Props = {
  spot: Spot;
  url?: string;
  images?: string[];
  averageRating?: number;
  reviewCount?: number;
};

function categoryToSchemaType(cat?: string) {
  if (!cat) return "LocalBusiness";
  const c = cat.toLowerCase();
  if (c.includes("hotel")) return "Hotel";
  if (c.includes("restaurant") || c.includes("food") || c.includes("cafe")) return "Restaurant";
  if (c.includes("bar") || c.includes("pub") || c.includes("nightclub")) return "BarOrPub";
  return "LocalBusiness";
}

function openingHoursToSpec(hours: Spot["openingHours"]) {
  if (!hours) return undefined;
  
  const mapDay: Record<string, string> = { mon:"Mo", tue:"Tu", wed:"We", thu:"Th", fri:"Fr", sat:"Sa", sun:"Su" };
  
  if (Array.isArray(hours)) {
    if (hours.length === 0) return undefined;

    // 문자열 배열인 경우 스키마 생성 스킵
    if (typeof hours[0] === 'string') {
        return undefined; 
    }

    // ✅ 강제 타입 단언(as)을 통해 TS 오류 해결
    return (hours as SpotOpeningHours[]).map(h => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.day?.slice(0,2).toLowerCase() in mapDay ? mapDay[h.day.slice(0,2).toLowerCase()] : undefined,
      opens: h.open, 
      closes: h.close,
    }));
  }

  // 객체 형태인 경우
  return Object.entries(hours).map(([k, v]: any) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: mapDay[k] ?? undefined,
    ...(v === "closed" ? {} : { opens: v?.open, closes: v?.close }),
  }));
}

export default function SpotSeo({ spot, url, images, averageRating, reviewCount }: Props) {
  const title = `${spot.name} | Vietnam Lounge`;
  const description =
    (spot.description || "베트남 인기 스팟 정보와 리뷰를 확인하세요.").slice(0, 160);
  
  const imgs = images && images.length 
    ? images 
    : [spot.heroImage, ...(spot.images || [])].filter(Boolean) as string[];

  const canonical = url || (typeof window !== "undefined" ? window.location.href : undefined);
  const schemaType = categoryToSchemaType(spot.category);
  
  // 좌표 호환성
  const lat = spot.latitude ?? spot.location?.lat;
  const lng = spot.longitude ?? spot.location?.lng;
  const hasGeo = typeof lat === "number" && typeof lng === "number";

  const jsonLd = useMemo(() => {
    const base: any = {
      "@context": "https://schema.org",
      "@type": schemaType,
      name: spot.name,
      description,
      url: canonical,
      image: imgs?.slice(0, 6),
      telephone: spot.phone || spot.contact?.phone,
      address: spot.address ? { "@type": "PostalAddress", streetAddress: spot.address } : undefined,
      geo: hasGeo ? { "@type": "GeoCoordinates", latitude: lat, longitude: lng } : undefined,
      openingHoursSpecification: openingHoursToSpec(spot.openingHours),
      sameAs: spot.website || spot.contact?.website ? [spot.website || spot.contact?.website] : undefined,
    };
    if (typeof averageRating === "number" && typeof reviewCount === "number") {
      base.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: Number(averageRating.toFixed(1)),
        reviewCount,
      };
    }
    return JSON.stringify(base);
  }, [schemaType, spot, description, canonical, imgs, hasGeo, lat, lng, averageRating, reviewCount]);

  const ogImage = imgs?.[0];

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        {canonical && <link rel="canonical" href={canonical} />}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {canonical && <meta property="og:url" content={canonical} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        <script type="application/ld+json">{jsonLd}</script>
      </Helmet>
    </>
  );
}
import React, { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import type { Spot } from "@/types/spot";

type Props = {
  spot: Spot;
  url?: string;                 // canonical
  images?: string[];            // og:image 우선순위
  averageRating?: number;       // 있으면 스키마에 포함
  reviewCount?: number;         // 있으면 스키마에 포함
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
    return hours.map(h => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.day?.slice(0,2).toLowerCase() in mapDay ? mapDay[h.day.slice(0,2).toLowerCase()] : undefined,
      opens: h.open, closes: h.close,
    }));
  }
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
  const imgs = images && images.length ? images : [spot.heroImage, ...(spot.images || [])].filter(Boolean);
  const canonical = url || (typeof window !== "undefined" ? window.location.href : undefined);
  const schemaType = categoryToSchemaType(spot.category);
  const hasGeo = typeof spot.latitude === "number" && typeof spot.longitude === "number";

  const jsonLd = useMemo(() => {
    const base: any = {
      "@context": "https://schema.org",
      "@type": schemaType,
      name: spot.name,
      description,
      url: canonical,
      image: imgs?.slice(0, 6),
      telephone: spot.phone,
      address: spot.address ? { "@type": "PostalAddress", streetAddress: spot.address } : undefined,
      geo: hasGeo ? { "@type": "GeoCoordinates", latitude: spot.latitude, longitude: spot.longitude } : undefined,
      openingHoursSpecification: openingHoursToSpec(spot.openingHours),
      sameAs: spot.website ? [spot.website] : undefined,
    };
    if (typeof averageRating === "number" && typeof reviewCount === "number") {
      base.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: Number(averageRating.toFixed(1)),
        reviewCount,
      };
    }
    return JSON.stringify(base);
  }, [schemaType, spot, description, canonical, imgs, hasGeo, averageRating, reviewCount]);

  const ogImage = imgs?.[0];

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        {canonical && <link rel="canonical" href={canonical} />}
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {canonical && <meta property="og:url" content={canonical} />}
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        {/* JSON-LD */}
        <script type="application/ld+json">{jsonLd}</script>
      </Helmet>
    </>
  );
}

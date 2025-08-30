import React from "react";
export default function StructuredData({ spot }:{spot:any}) {
  const json:any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": spot.name,
    "image": spot.images?.[0],
    "address": { "@type":"PostalAddress", "addressLocality": spot.city, "addressCountry":"VN" },
    "geo": spot.location ? { "@type":"GeoCoordinates", "latitude": spot.location.latitude, "longitude": spot.location.longitude } : undefined,
    "aggregateRating": spot.rating ? { "@type":"AggregateRating", "ratingValue": spot.rating, "reviewCount": spot.reviewCount ?? 0 } : undefined,
    "url": `${typeof window !== 'undefined' ? window.location.origin : ''}/spots/${spot.id}`
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}

/* @file apps/web/src/utils/places.ts */
declare global {
  interface Window {
    google?: typeof google;
  }
}

export type PlaceLite = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  rating?: number;
  ratingsTotal?: number;
  openNow?: boolean | null;
  types?: string[];
  photoUrl?: string | null;
  url?: string | null;
  website?: string | null;
  phone?: string | null;
  priceLevel?: number | null;
  businessStatus?: string | null;
};

/** v3 동적 로딩: 필요 시에만 Places 라이브러리를 로드 */
export async function ensurePlacesLibrary(): Promise<void> {
  const g = window.google as any;
  if (!g?.maps) return;
  if (typeof g.maps.importLibrary === "function") {
    // 이미 로드되어 있으면 no-op
    await g.maps.importLibrary("places");
  }
}

/** PlacePhoto 또는 photo_reference를 받아 URL 생성 */
export function photoUrlFrom(
  refOrPhoto?: string | google.maps.places.PlacePhoto,
  maxWidth = 640
): string | null {
  if (!refOrPhoto) return null;
  if (typeof refOrPhoto === "string") return buildPhotoUrl(refOrPhoto, maxWidth);
  try {
    return refOrPhoto.getUrl({ maxWidth });
  } catch {
    return null;
  }
}

/** Web Service Place Photos 엔드포인트 URL (레거시 photo_reference 지원) */
export function buildPhotoUrl(photoReference: string, maxWidth = 640): string {
  const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || "";
  const u = new URL("https://maps.googleapis.com/maps/api/place/photo");
  u.searchParams.set("maxwidth", String(maxWidth));
  u.searchParams.set("photo_reference", photoReference);
  if (key) u.searchParams.set("key", key);
  return u.toString();
}

/** Details 호출 시 쿼터 절약용 최소 필드 셋 */
export const DETAILS_MIN_FIELDS: Array<keyof google.maps.places.PlaceResult> = [
  "place_id",
  "name",
  "geometry",
  "formatted_address",
  "opening_hours",
  "photos",
  "types",
  "utc_offset_minutes",
  "rating",
  "user_ratings_total",
  "price_level",
  "business_status",
  "url",
  "website",
  "international_phone_number",
];

export function ensureLatLngLiteral(
  v: google.maps.LatLng | google.maps.LatLngLiteral
): google.maps.LatLngLiteral {
  // @ts-ignore
  if (typeof v.lat === "function") return { lat: v.lat(), lng: v.lng() };
  return v as google.maps.LatLngLiteral;
}

export function toPlaceLite(
  p: google.maps.places.PlaceResult,
  getPhoto?: (ref?: string | google.maps.places.PlacePhoto, maxWidth?: number) => string | null
): PlaceLite {
  const loc = p.geometry?.location
    ? { lat: p.geometry.location.lat(), lng: p.geometry.location.lng() }
    : { lat: 0, lng: 0 };

  let photo: string | null = null;
  if (p.photos?.length) {
    const ph = p.photos[0];
    photo = getPhoto ? getPhoto(ph, 800) : photoUrlFrom(ph, 800);
  // 일부 TextSearch 응답의 레거시 photo_reference 대응
  // @ts-expect-error legacy path
  } else if (p?.photo_reference) {
    // @ts-expect-error legacy path
    photo = buildPhotoUrl(p.photo_reference, 800);
  }

  return {
    id: p.place_id!,
    name: p.name || "",
    lat: loc.lat,
    lng: loc.lng,
    address: p.formatted_address || p.vicinity || "",
    rating: p.rating ?? undefined,
    ratingsTotal: p.user_ratings_total ?? undefined,
    openNow: p.opening_hours?.isOpen?.() ?? null,
    types: p.types || undefined,
    photoUrl: photo,
    // 아래 필드는 Details 호출 시에만 채워지므로 null 허용
    url: (p as any).url ?? null,
    website: (p as any).website ?? null,
    phone: (p as any).international_phone_number ?? null,
    priceLevel: (p as any).price_level ?? null,
    businessStatus: (p as any).business_status ?? null,
  };
}

export function sortByQuality(a: PlaceLite, b: PlaceLite) {
  const ar = a.rating ?? 0;
  const br = b.rating ?? 0;
  if (ar !== br) return br - ar;
  const at = a.ratingsTotal ?? 0;
  const bt = b.ratingsTotal ?? 0;
  if (at !== bt) return bt - at;
  return a.name.localeCompare(b.name);
}

export function kmBetween(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

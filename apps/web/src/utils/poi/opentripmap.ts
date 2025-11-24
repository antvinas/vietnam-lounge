// apps/web/src/utils/poi/opentripmap.ts
// OpenTripMap (https://dev.opentripmap.org) 라이트 래퍼
// .env: VITE_OPENTRIPMAP_API_KEY 필요

export interface OtmPlaceLite {
  xid: string;
  name: string;
  lat: number;
  lon: number;
  kinds?: string;
  rate?: number;
  osm?: string;
}

export interface OtmPlaceDetails extends OtmPlaceLite {
  address?: Record<string, string>;
  wikipedia_extracts?: { text: string };
  info?: { descr: string };
  url?: string;
  preview?: { source: string };
}

const BASE = 'https://api.opentripmap.com/0.1/en';

function getApiKey() {
  const k = import.meta.env.VITE_OPENTRIPMAP_API_KEY as string | undefined;
  if (!k) throw new Error('VITE_OPENTRIPMAP_API_KEY is missing');
  return k;
}

export type KindGroup = 'foods' | 'cafes' | 'sights' | 'shops' | 'hotels';

export const KIND_GROUPS: Record<KindGroup, string> = {
  foods: 'foods,restaurants',
  cafes: 'cafes',
  sights: 'interesting_places,sights,monuments,museums,architecture,urban_environment',
  shops: 'shops,supermarkets,marketplaces',
  hotels: 'accomodations,hotels,hostels',
};

export async function searchByRadius(params: {
  lat: number;
  lon: number;
  radius?: number; // meters, default 3000
  kinds?: string; // comma-separated kinds, or use KIND_GROUPS
  limit?: number; // default 30
  rate?: number; // 1..3 (popularity), optional
}): Promise<OtmPlaceLite[]> {
  const { lat, lon } = params;
  const radius = params.radius ?? 3000;
  const limit = params.limit ?? 30;
  const apiKey = getApiKey();

  const qs = new URLSearchParams({
    apikey: apiKey,
    radius: String(radius),
    lon: String(lon),
    lat: String(lat),
    limit: String(limit),
    format: 'json',
  });
  if (params.kinds) qs.set('kinds', params.kinds);
  if (params.rate) qs.set('rate', String(params.rate));

  const url = `${BASE}/places/radius?${qs.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenTripMap radius search failed: ${res.status}`);
  const data = await res.json();
  // API는 배열로 응답. 필드 이름 통일
  return (data as any[]).map((p) => ({
    xid: p.xid,
    name: p.name,
    lat: p.point?.lat ?? p.lat,
    lon: p.point?.lon ?? p.lon,
    kinds: p.kinds,
    rate: p.rate,
    osm: p.osm,
  }));
}

export async function getPlaceDetails(xid: string): Promise<OtmPlaceDetails> {
  const apiKey = getApiKey();
  const url = `${BASE}/places/xid/${encodeURIComponent(xid)}?apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenTripMap details failed: ${res.status}`);
  const p = await res.json();
  return {
    xid: p.xid,
    name: p.name,
    lat: p.point?.lat ?? p.lat,
    lon: p.point?.lon ?? p.lon,
    kinds: p.kinds,
    rate: p.rate,
    osm: p.osm,
    address: p.address,
    wikipedia_extracts: p.wikipedia_extracts,
    info: p.info,
    url: p.url,
    preview: p.preview,
  };
}

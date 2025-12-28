// apps/web/src/utils/maps/urls.ts
export type TravelModeAlias = "driving" | "walking" | "transit" | "bicycling";
type LatLng = { lat: number; lng: number };

const enc = encodeURIComponent;
const fmtLL = (v: LatLng | string) => (typeof v === "string" ? v : `${v.lat},${v.lng}`);

export function buildDirectionsUrl(opts: {
  origin: LatLng | string;
  destination: LatLng | string;
  mode?: TravelModeAlias;
  waypoints?: Array<LatLng | string>;
}) {
  const mode = opts.mode ?? "driving";
  const base = "https://www.google.com/maps/dir/?api=1";
  const params = [
    `origin=${enc(fmtLL(opts.origin))}`,
    `destination=${enc(fmtLL(opts.destination))}`,
    `travelmode=${enc(mode)}`,
  ];
  if (opts.waypoints?.length) {
    const wp = opts.waypoints.map(fmtLL).join("|");
    params.push(`waypoints=${enc(wp)}`);
  }
  return `${base}&${params.join("&")}`;
}

export function buildSearchUrl(q: string, near?: LatLng) {
  const base = "https://www.google.com/maps/search/?api=1";
  const params = [`query=${enc(q)}`];
  if (near) params.push(`query_place_id=&center=${enc(fmtLL(near))}`);
  return `${base}&${params.join("&")}`;
}

export function buildPlaceUrlById(placeId: string) {
  const base = "https://www.google.com/maps/place/?";
  return `${base}q=place_id:${enc(placeId)}`;
}

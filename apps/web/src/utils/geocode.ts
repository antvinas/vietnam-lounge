export type LatLng = { lat: number; lng: number };

const GOOGLE_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

function loadGeocoder(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
    return Promise.resolve((window as any).google.maps.Geocoder);
  }
  return Promise.resolve(null);
}

export async function reverseGeocode({ lat, lng }: LatLng): Promise<string | null> {
  const Geocoder = await loadGeocoder();
  if (Geocoder) {
    const g = new Geocoder();
    return new Promise((res) =>
      g.geocode({ location: { lat, lng } }, (r: any, status: any) =>
        res(status === 'OK' && r?.[0]?.formatted_address ? r[0].formatted_address : null)
      )
    );
  }
  if (!GOOGLE_KEY) return null;
  const u = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}`;
  try {
    const j = await (await fetch(u)).json();
    return j.results?.[0]?.formatted_address ?? null;
  } catch {
    return null;
  }
}

export async function geocodeAddress(q: string): Promise<LatLng | null> {
  const Geocoder = await loadGeocoder();
  if (Geocoder) {
    const g = new Geocoder();
    return new Promise((res) =>
      g.geocode({ address: q }, (r: any, status: any) =>
        res(status === 'OK' && r?.[0]?.geometry?.location
          ? { lat: r[0].geometry.location.lat(), lng: r[0].geometry.location.lng() }
          : null)
      )
    );
  }
  if (!GOOGLE_KEY) return null;
  const u = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${GOOGLE_KEY}`;
  try {
    const j = await (await fetch(u)).json();
    const p = j.results?.[0]?.geometry?.location;
    return p ? { lat: p.lat, lng: p.lng } : null;
  } catch {
    return null;
  }
}

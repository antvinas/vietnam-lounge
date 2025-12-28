// apps/web/src/lib/googleMaps.ts

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

interface APIOptions {
  version?: string;
  key?: string;
  libraries?: ("places" | "geometry")[];
}

// 🟢 [수정] var google 삭제 (이미 @types/google.maps에 있음)

export const loadGoogleMapsApi = (options: APIOptions = {}) => {
  return new Promise<void>((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    const libParam = options.libraries ? `&libraries=${options.libraries.join(",")}` : "";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}${libParam}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};
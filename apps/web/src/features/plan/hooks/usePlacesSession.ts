import { useMemo } from "react";

export default function usePlacesSession() {
  return useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const places = (window as any)?.google?.maps?.places;
    if (!places) return undefined;
    return new places.AutocompleteSessionToken();
  }, []);
}

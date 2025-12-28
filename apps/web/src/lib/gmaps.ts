import type { Libraries } from "@react-google-maps/api";

export const GMAPS_LIBRARIES: Libraries = ["places", "routes"];
export const GMAPS_LOADER_ID = "gmaps-sdk";

export const GMAPS_LOADER_PROPS = {
  id: GMAPS_LOADER_ID,
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
  libraries: GMAPS_LIBRARIES,
  language: "ko",
  region: "VN",
};

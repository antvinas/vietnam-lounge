// apps/web/src/utils/places.ts

export type PlaceLite = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  photos?: string[];
  rating?: number;
  user_ratings_total?: number;
  website?: string;
  international_phone_number?: string;
  opening_hours?: google.maps.places.PlaceOpeningHours | undefined;
};

export const getPlacePhotoUrl = (photoReference: string, maxWidth = 400) => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return "";
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${key}`;
};

export const extractPlaceDetails = (place: google.maps.places.PlaceResult): PlaceLite => {
  const photos =
    place.photos
      ?.map((p) => {
        try {
          return p.getUrl({ maxWidth: 400 });
        } catch {
          return "";
        }
      })
      .filter(Boolean) || [];

  return {
    name: place.name || "",
    address: place.formatted_address || "",
    lat: place.geometry?.location?.lat() || 0,
    lng: place.geometry?.location?.lng() || 0,
    placeId: place.place_id || "",
    photos,
    rating: place.rating,
    user_ratings_total: place.user_ratings_total,
    website: place.website,
    international_phone_number: place.international_phone_number,
    opening_hours: place.opening_hours,
  };
};

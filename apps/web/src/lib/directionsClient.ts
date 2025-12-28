// apps/web/src/lib/directionsClient.ts

export type TravelMode = "car" | "walk" | "transit" | "bike";

export interface DirectionsResult {
  routes: google.maps.DirectionsRoute[];
  request: google.maps.DirectionsRequest;
}

export interface RouteRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  mode: TravelMode;
}

export async function getRoute(req: RouteRequest): Promise<DirectionsResult | null> {
  if (!window.google || !window.google.maps) return null;

  const directionsService = new google.maps.DirectionsService();

  // 🟢 Google Maps Enum 매핑
  let mode = google.maps.TravelMode.DRIVING;
  if (req.mode === "walk") mode = google.maps.TravelMode.WALKING;
  else if (req.mode === "transit") mode = google.maps.TravelMode.TRANSIT;
  else if (req.mode === "bike") mode = google.maps.TravelMode.BICYCLING;

  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        origin: req.origin,
        destination: req.destination,
        travelMode: mode,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          resolve(result);
        } else {
          console.error(`Directions request failed due to ${status}`);
          resolve(null);
        }
      }
    );
  });
}
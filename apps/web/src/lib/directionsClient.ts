/* DirectionsService 래퍼 + 요약 생성 */
import { RouteSummary, TravelMode, TrafficModel } from "@/store/useRouteStore";

type RouteRequest = {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  mode: TravelMode;
  departureDateTime?: string;
  arrivalDateTime?: string;   // TRANSIT only
  trafficModel?: TrafficModel; // DRIVING only
  unitSystem?: google.maps.UnitSystem;
  optimizeWaypoints?: boolean; // DRIVING only
  waypoints?: google.maps.DirectionsWaypoint[];
};

export async function fetchDirections(req: RouteRequest) {
  const { DirectionsService } = (await google.maps.importLibrary("routes")) as google.maps.RoutesLibrary;
  const svc = new DirectionsService();

  const base: google.maps.DirectionsRequest = {
    origin: req.origin,
    destination: req.destination,
    travelMode: google.maps.TravelMode[req.mode],
    unitSystem: req.unitSystem ?? google.maps.UnitSystem.METRIC,
    waypoints: req.waypoints,
    optimizeWaypoints: req.mode === "DRIVING" ? Boolean(req.optimizeWaypoints) : undefined,
  };

  if (req.mode === "DRIVING" && req.departureDateTime) {
    base.drivingOptions = {
      departureTime: new Date(req.departureDateTime),
      trafficModel: req.trafficModel
        ? google.maps.TrafficModel[req.trafficModel.toUpperCase() as any]
        : google.maps.TrafficModel.BEST_GUESS,
    };
  }

  if (req.mode === "TRANSIT") {
    const transitOptions: google.maps.TransitOptions = {};
    if (req.arrivalDateTime) transitOptions.arrivalTime = new Date(req.arrivalDateTime);
    else if (req.departureDateTime) transitOptions.departureTime = new Date(req.departureDateTime);
    base.transitOptions = transitOptions;
  }

  const result = await svc.route(base);
  return { result, summaries: summarize(result) };
}

export function summarize(result: google.maps.DirectionsResult): RouteSummary[] {
  return (result.routes || []).map((route, idx) => {
    const leg = route.legs?.[0];
    const etaText = leg?.duration?.text;
    const distanceText = leg?.distance?.text;

    let transfers = 0;
    if (leg?.steps) {
      for (const s of leg.steps) if (s.travelMode === google.maps.TravelMode.TRANSIT) transfers++;
      transfers = Math.max(0, transfers - 1);
    }

    const fareText = (route as any).fare?.text as string | undefined;

    return { id: `r${idx}`, etaText, distanceText, transfers: Number.isFinite(transfers) ? transfers : undefined, fareText };
  });
}

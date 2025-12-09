/**
 * DirectionsService를 3개의 trafficModel로 호출하여 예측 소요시간 범위를 산출.
 * - drivingOptions.departureTime 필요
 * - duration_in_traffic 우선, 없으면 duration 사용
 */

export type TrafficModel = "best_guess" | "pessimistic" | "optimistic";
export type SimResult = {
  best_guess: number;    // 초(second)
  pessimistic: number;   // 초
  optimistic: number;    // 초
};

type Waypoint = google.maps.DirectionsWaypoint;

function sumDurationInTraffic(result: google.maps.DirectionsResult) {
  const legs = result.routes?.[0]?.legs ?? [];
  let sec = 0;
  for (const l of legs) {
    sec += (l.duration_in_traffic?.value ?? l.duration?.value ?? 0);
  }
  return sec;
}

function routeOnce(
  svc: google.maps.DirectionsService,
  req: google.maps.DirectionsRequest
) {
  return new Promise<google.maps.DirectionsResult>((resolve, reject) => {
    svc.route(req, (res, status) => {
      if (status === "OK") resolve(res);
      else reject(new Error(String(status)));
    });
  });
}

export async function simulateTrafficRanges(params: {
  origin: google.maps.LatLng | string;
  destination: google.maps.LatLng | string;
  waypoints?: Waypoint[];
  travelMode?: google.maps.TravelMode; // 기본 DRIVING
  departureTime: Date;
}): Promise<SimResult> {
  const g = (window as any).google;
  const svc = new g.maps.DirectionsService();

  const base: google.maps.DirectionsRequest = {
    origin: params.origin,
    destination: params.destination,
    waypoints: params.waypoints,
    optimizeWaypoints: false,
    travelMode: params.travelMode ?? g.maps.TravelMode.DRIVING,
    drivingOptions: {
      departureTime: params.departureTime,
      // trafficModel은 아래에서 각각 설정
    } as google.maps.DrivingOptions,
  };

  const [best, pess, opti] = await Promise.all([
    routeOnce(svc, {
      ...base,
      drivingOptions: { ...base.drivingOptions!, trafficModel: "best_guess" },
    }),
    routeOnce(svc, {
      ...base,
      drivingOptions: { ...base.drivingOptions!, trafficModel: "pessimistic" },
    }),
    routeOnce(svc, {
      ...base,
      drivingOptions: { ...base.drivingOptions!, trafficModel: "optimistic" },
    }),
  ]);

  return {
    best_guess:  sumDurationInTraffic(best),
    pessimistic: sumDurationInTraffic(pess),
    optimistic:  sumDurationInTraffic(opti),
  };
}

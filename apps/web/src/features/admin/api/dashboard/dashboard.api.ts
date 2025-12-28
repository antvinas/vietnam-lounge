// apps/web/src/features/admin/api/dashboard/dashboard.api.ts

import { collection, getCountFromServer, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { safeGet } from "../http";

export const getDashboardStats = async (): Promise<{
  userCount: number;
  spotCount: number;
  eventCount: number;
  sponsorCount: number;
}> => {
  // 1) 서버 endpoint 우선
  try {
    const raw: any = await safeGet("admin/stats");
    return {
      userCount: Number(raw?.userCount ?? raw?.users ?? 0),
      spotCount: Number(raw?.spotCount ?? raw?.spots ?? 0),
      eventCount: Number(raw?.eventCount ?? raw?.events ?? 0),
      sponsorCount: Number(raw?.sponsorCount ?? raw?.sponsored ?? raw?.sponsors ?? 0),
    };
  } catch {
    // 2) fallback: Firestore count
  }

  const [userCount, spots, adultSpots, events, adultEvents] = await Promise.all([
    getCountFromServer(collection(db, "users")),
    getCountFromServer(collection(db, "spots")),
    getCountFromServer(collection(db, "adult_spots")),
    getCountFromServer(collection(db, "events")),
    getCountFromServer(collection(db, "adult_events")),
  ]);

  const [s1, s2] = await Promise.all([
    getCountFromServer(query(collection(db, "spots"), where("isSponsored", "==", true))),
    getCountFromServer(query(collection(db, "adult_spots"), where("isSponsored", "==", true))),
  ]);

  return {
    userCount: userCount.data().count,
    spotCount: spots.data().count + adultSpots.data().count,
    eventCount: events.data().count + adultEvents.data().count,
    sponsorCount: s1.data().count + s2.data().count,
  };
};

/**
 * Sponsor/Ads global config
 * - Centralizes env + policy so UI/API share one source of truth.
 */

export type SponsorLevel = "banner" | "slider" | "infeed";

export const SPONSOR_CONFIG = {
  // Env
  GA_ID: import.meta.env.VITE_GA_ID || "",
  COLLECTIONS: {
    ADS: import.meta.env.VITE_ADS_COLLECTION || "sponsorSpots",
    REQUESTS: "sponsorRequests",
    LOGS: "ads_logs",
    SPOTS: "spots",
  },

  // Display limits
  LIMITS: {
    banner: 3,        // max premium banners on home
    slider: 8,        // max items in sponsored slider
    infeedInterval: 6 // insert 1 infeed after every N normal cards
  },

  // Default durations (days) if none provided on approval
  EXPIRE_DAYS: {
    banner: 30,
    slider: 30,
    infeed: 30,
  } as Record<SponsorLevel, number> & { infeed: number },

  // Labels for disclosure
  LABELS: {
    default: "추천",
    alt: "협찬",
  },

  // Policy flags
  POLICY: {
    // In Night mode, show affiliate-only units (no AdSense)
    nightlifeAffiliateOnly: true,
  },
} as const;

export const isExpired = (until?: string | number | null) => {
  if (!until) return false;
  const t = typeof until === "number" ? until : Date.parse(until);
  return Number.isFinite(t) ? t < Date.now() : false;
};

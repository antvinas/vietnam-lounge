import { lazy } from "react";

export const routes = [
    { path: "/", Component: lazy(() => import("@/pages/Home")) },

    // === 신규: 여행 스팟(일반) ===
    { path: "/spots", Component: lazy(() => import("@/pages/Spots")) },
    // 세부 페이지 준비되면 활성화
    // { path: "/spot/:id", Component: lazy(() => import("@/pages/SpotDetail")) },

    // === 성인 전용 ===
    { path: "/adult", Component: lazy(() => import("@/pages/Adult")) },
    { path: "/adult/spots", Component: lazy(() => import("@/pages/AdultSpots")) },

    // === 레거시 URL 리다이렉트(북마크/SEO 보호) ===
    { path: "/places", Component: lazy(() => import("@/pages/RedirectLegacyPlaces")) },
    { path: "/place/:id", Component: lazy(() => import("@/pages/RedirectLegacyPlaceDetail")) },
    { path: "/adult/places", Component: lazy(() => import("@/pages/RedirectLegacyAdultPlaces")) },

    // 기타
    { path: "/plans", Component: lazy(() => import("@/pages/Plans")) },
    { path: "/community", Component: lazy(() => import("@/pages/Community")) },
    { path: "/events", Component: lazy(() => import("@/pages/Events")) },
    { path: "/my", Component: lazy(() => import("@/pages/My")) },
    { path: "/about", Component: lazy(() => import("@/pages/About")) },
    { path: "/privacy", Component: lazy(() => import("@/pages/Privacy")) },
    { path: "/policy", Component: lazy(() => import("@/pages/Policy")) },

    ...(import.meta.env.DEV
        ? [{ path: "/admin/seed", Component: lazy(() => import("@/pages/AdminSeed")) }]
        : []),

    { path: "*", Component: lazy(() => import("@/pages/NotFound")) },
];

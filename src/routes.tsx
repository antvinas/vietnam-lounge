// src/routes.tsx
import { lazy } from "react";

export const routes = [
    { path: "/", Component: lazy(() => import("@/pages/Home")) },
    { path: "/places", Component: lazy(() => import("@/pages/Places")) },
    { path: "/place/:id", Component: lazy(() => import("@/pages/PlaceDetail")) },
    { path: "/plans", Component: lazy(() => import("@/pages/Plans")) },
    { path: "/community", Component: lazy(() => import("@/pages/Community")) },
    { path: "/events", Component: lazy(() => import("@/pages/Events")) },
    { path: "/my", Component: lazy(() => import("@/pages/My")) },
    { path: "/adult", Component: lazy(() => import("@/pages/Adult")) },
    // ✅ DEV 전용 시딩 페이지
    ...(import.meta.env.DEV ? [{ path: "/admin/seed", Component: lazy(() => import("@/pages/AdminSeed")) }] : []),
    { path: "*", Component: lazy(() => import("@/pages/NotFound")) },
    { path: "/about", Component: lazy(() => import("@/pages/About")) },
    { path: "/privacy", Component: lazy(() => import("@/pages/Privacy")) },
    { path: "/policy", Component: lazy(() => import("@/pages/Policy")) },
];

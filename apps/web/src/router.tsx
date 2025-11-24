import React, { lazy, useEffect } from "react";
import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import AdultLayout from "./layout/AdultLayout";

// ── Lazy pages
const Home = lazy(() => import("./pages/Home/Home"));
const Plan = lazy(() => import("./pages/Plan"));
const PlanSearchOverlay = lazy(() => import("./pages/Plan/PlanSearchOverlay"));
const SampleChooser = lazy(() => import("./pages/Plan/SampleChooser"));
const PlanShareView = lazy(() => import("./pages/Plan/PlanShareView"));

const SpotsHome = lazy(() => import("./pages/Spots/SpotsHome"));
const SpotDetailPage = lazy(() => import("./pages/Spots/SpotDetailPage"));
const EventList = lazy(() => import("./pages/Events/EventList"));
const EventDetail = lazy(() => import("./pages/Events/EventDetail"));

const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));

const Profile = lazy(() => import("./pages/User/Profile"));
const MyPageHome = lazy(() => import("./pages/MyPage/MyPageHome"));
const MyCoupons = lazy(() => import("./pages/MyPage/MyCoupons"));
const MyFavorites = lazy(() => import("./pages/MyPage/MyFavorites"));
const Settings = lazy(() => import("./pages/MyPage/Settings"));

const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AddEvent = lazy(() => import("./pages/Admin/AddEvent"));
const AddNightlife = lazy(() => import("./pages/Admin/AddNightlife"));
const AddSpot = lazy(() => import("./pages/Admin/AddSpot"));
const ManageEvents = lazy(() => import("./pages/Admin/ManageEvents"));
const ManageUsers = lazy(() => import("./pages/Admin/ManageUsers"));

const SponsorInfo = lazy(() => import("./pages/Sponsor/SponsorInfo"));
const SponsorApply = lazy(() => import("./pages/Sponsor/SponsorApply"));

const NotFound = lazy(() => import("./components/common/NotFound"));

// ── Stores & guards
import { useAuthStore } from "./store/auth.store";
import { useStore as useAdultStore } from "./store/adult.store";
import useUiStore from "./store/ui.store";

// ──────────────────────────────────────────────────────────────────────────────
// Helper UI
const RouterError: React.FC = () => (
  <div style={{ padding: 24 }}>
    <h2 style={{ marginBottom: 8 }}>애플리케이션 오류</h2>
    <p style={{ color: "#6b7280" }}>잠시 후 다시 시도해 주세요.</p>
  </div>
);

/** /adult 경로 진입 시 UI 모드 동기화 */
const RouteModeWatcher: React.FC = () => {
  const location = useLocation();
  const { setContentMode } = useUiStore();
  useEffect(() => {
    setContentMode(location.pathname.startsWith("/adult") ? "nightlife" : "explorer");
  }, [location.pathname, setContentMode]);
  return null;
};

const NightlifeProtectedRoute: React.FC = () => {
  const { isAgeVerified } = useAdultStore();
  return isAgeVerified ? <Outlet /> : <Navigate to="/adult/gate" replace />;
};

const AuthProtectedRoute: React.FC = () => {
  const { isLoggedIn } = useAuthStore();
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

const AdminProtectedRoute: React.FC = () => {
  const { isLoggedIn, user } = useAuthStore();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  const isAdmin =
    user?.isAdmin === true ||
    user?.role === "admin" ||
    (Array.isArray(user?.roles) && user.roles.includes("admin"));
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

const ExplorerShell: React.FC = () => (
  <>
    <RouteModeWatcher />
    <MainLayout />
  </>
);

/** 함수 선언문(호이스팅 안전) */
function AdultGatePage() {
  return (
    <MainLayout>
      <div className="p-6">권한이 필요합니다.</div>
    </MainLayout>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Router (Data Router)
export const router = createBrowserRouter(
  [
    // Explorer (루트)
    {
      path: "/",
      element: <ExplorerShell />,
      errorElement: <RouterError />,
      children: [
        { index: true, element: <Home /> }, // "/"에서 홈 노출
        { path: "home", element: <Home /> }, // 선택 사항: "/home"도 사용

        // Plan (중첩 라우트: search, sample — 배경 라우팅)
        {
          path: "plan",
          element: <Plan />,
          children: [
            { path: "search", element: <PlanSearchOverlay /> },
            { path: "sample", element: <SampleChooser /> },
          ],
        },
        { path: "plan/share/:id", element: <PlanShareView /> },

        // Auth
        { path: "login", element: <Login /> },
        { path: "register", element: <Register /> },

        // Spots / Events
        { path: "spots", element: <SpotsHome /> },
        { path: "spots/:spotId", element: <SpotDetailPage /> },

        { path: "events", element: <EventList /> },
        { path: "events/:eventId", element: <EventDetail /> },

        // Sponsor
        { path: "sponsor/info", element: <SponsorInfo /> },
        {
          element: <AuthProtectedRoute />,
          children: [{ path: "sponsor/apply", element: <SponsorApply /> }],
        },

        // MyPage (보호)
        {
          element: <AuthProtectedRoute />,
          children: [
            { path: "profile", element: <Profile /> },
            {
              path: "mypage",
              element: <Outlet />,
              children: [
                { index: true, element: <MyPageHome /> },
                { path: "coupons", element: <MyCoupons /> },
                { path: "favorites", element: <MyFavorites /> },
                { path: "settings", element: <Settings /> },
              ],
            },
          ],
        },

        // Admin (보호)
        {
          element: <AdminProtectedRoute />,
          children: [
            { path: "admin", element: <AdminDashboard /> },
            { path: "admin/events", element: <ManageEvents /> },
            { path: "admin/users", element: <ManageUsers /> },
            { path: "admin/add-event", element: <AddEvent /> },
            { path: "admin/add-spot", element: <AddSpot /> },
            { path: "admin/add-nightlife", element: <AddNightlife /> },
          ],
        },
      ],
    },

    // Nightlife
    { path: "/adult/gate", element: <AdultGatePage /> },
    {
      path: "/adult",
      element: <AdultLayout />,
      children: [
        {
          element: <NightlifeProtectedRoute />,
          children: [
            { index: true, element: <Navigate to="spots" replace /> },
            { path: "spots", element: <SpotsHome /> },
            { path: "spots/:spotId", element: <SpotDetailPage /> },
            { path: "events", element: <EventList /> },
            { path: "events/:eventId", element: <EventDetail /> },
          ],
        },
      ],
    },

    // 404
    { path: "*", element: <NotFound /> },
  ],
  { future: { v7_relativeSplatPath: true } }
);

export default router;

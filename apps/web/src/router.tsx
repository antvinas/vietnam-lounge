import React, { lazy, useEffect } from "react";
import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import AdultLayout from "./layout/AdultLayout";

// ── Lazy pages
const Home = lazy(() => import("./features/home/pages/Home"));
const Plan = lazy(() => import("./features/plan/pages/PlanPage"));
const PlanSearchOverlay = lazy(() => import("./features/plan/pages/PlanSearchOverlay"));
const SampleChooser = lazy(() => import("./features/plan/pages/SampleChooser"));
const PlanShareView = lazy(() => import("./features/plan/pages/PlanShareView"));

const SpotsHome = lazy(() => import("./features/spot/pages/SpotsHome"));
const SpotDetailPage = lazy(() => import("./features/spot/pages/SpotDetailPage"));
const EventList = lazy(() => import("./features/event/pages/EventList"));
const EventDetail = lazy(() => import("./features/event/pages/EventDetail"));

const AdultHome = lazy(() => import("./features/Adult/pages/AdultHome"));

const Login = lazy(() => import("@/features/auth/pages/Login"));
const Register = lazy(() => import("@/features/auth/pages/Register"));
// 비밀번호 찾기 페이지 (선택사항, 파일이 있다면 주석 해제)
// const ForgotPassword = lazy(() => import("@/features/auth/pages/ForgotPassword"));

const Profile = lazy(() => import("./features/User/pages/Profile"));
const MyPageHome = lazy(() => import("./features/User/pages/MyPageHome")); // 대시보드(Overview) 역할
const MyCoupons = lazy(() => import("./features/User/pages/MyCoupons"));
const MyFavorites = lazy(() => import("./features/User/pages/MyFavorites")); 
const Settings = lazy(() => import("./features/User/pages/Settings"));
const MyReviews = lazy(() => import("./features/User/pages/MyReviews")); // ✅ [추가] 내 리뷰 페이지

const AdminDashboard = lazy(() => import("./features/admin/pages/AdminDashboard"));
const AddEvent = lazy(() => import("./features/admin/pages/AddEvent"));
const AddNightlife = lazy(() => import("./features/admin/pages/AddNightlife"));
const AddSpot = lazy(() => import("./features/admin/pages/AddSpot"));
const ManageEvents = lazy(() => import("./features/admin/pages/ManageEvents"));
const ManageUsers = lazy(() => import("./features/admin/pages/ManageUsers"));

const SponsorInfo = lazy(() => import("./features/Sponsor/pages/SponsorInfo"));
const SponsorApply = lazy(() => import("./features/Sponsor/pages/SponsorApply"));

const NotFound = lazy(() => import("./components/common/NotFound"));

// ── Stores & guards
import { useAuthStore } from "./features/auth/stores/auth.store";
import { useStore as useAdultStore } from "./features/Adult/stores/adult.store";
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
        { index: true, element: <Home /> }, 
        { path: "home", element: <Home /> },

        // Plan
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
        // { path: "forgot-password", element: <ForgotPassword /> }, // 필요시 주석 해제

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
              element: <Outlet />, // 중첩 라우팅 아웃렛
              children: [
                { index: true, element: <MyPageHome /> }, // /mypage (대시보드)
                { path: "coupons", element: <MyCoupons /> }, // /mypage/coupons
                { path: "favorites", element: <MyFavorites /> }, // /mypage/favorites
                { path: "reviews", element: <MyReviews /> }, // ✅ [추가] /mypage/reviews
                { path: "settings", element: <Settings /> }, // /mypage/settings
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
            { index: true, element: <AdultHome /> }, 
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
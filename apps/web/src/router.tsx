// apps/web/src/router.tsx
import React, { Suspense, lazy, useEffect } from "react";
import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";

// ✅ alias로 통일 (중복 모듈/스토어 생성 방지)
import MainLayout from "@/layout/MainLayout";
import AdultLayout from "@/layout/AdultLayout";

// ── Lazy pages (User)
const Home = lazy(() => import("@/features/home/pages/Home"));
const Plan = lazy(() => import("@/features/plan/pages/PlanPage"));
const PlanSearchOverlay = lazy(() => import("@/features/plan/pages/PlanSearchOverlay"));
const SampleChooser = lazy(() => import("@/features/plan/pages/SampleChooser"));
const PlanShareView = lazy(() => import("@/features/plan/pages/PlanShareView"));

const SpotsHome = lazy(() => import("@/features/spot/pages/SpotsHome"));
const SpotDetailPage = lazy(() => import("@/features/spot/pages/SpotDetailPage"));
const EventList = lazy(() => import("@/features/event/pages/EventList"));
const EventDetail = lazy(() => import("@/features/event/pages/EventDetail"));

const AdultHome = lazy(() => import("@/features/Adult/pages/AdultHome"));

const Login = lazy(() => import("@/features/auth/pages/Login"));
const Register = lazy(() => import("@/features/auth/pages/Register"));

const Profile = lazy(() => import("@/features/User/pages/Profile"));
const MyPageHome = lazy(() => import("@/features/User/pages/MyPageHome"));
const MyCoupons = lazy(() => import("@/features/User/pages/MyCoupons"));
const MyFavorites = lazy(() => import("@/features/User/pages/MyFavorites"));
const Settings = lazy(() => import("@/features/User/pages/Settings"));
const MyReviews = lazy(() => import("@/features/User/pages/MyReviews"));

const Forbidden = lazy(() => import("@/components/common/Forbidden"));

// ── Lazy pages (Admin)
const AdminLayout = lazy(() => import("@/features/admin/components/AdminLayout"));
const AdminDashboard = lazy(() => import("@/features/admin/pages/AdminDashboard"));
const AdminSpotList = lazy(() => import("@/features/admin/pages/AdminSpotList"));
const AdminSpotForm = lazy(() => import("@/features/admin/pages/AdminSpotForm"));
const ManageEvents = lazy(() => import("@/features/admin/pages/ManageEvents"));
const AddEvent = lazy(() => import("@/features/admin/pages/AddEvent"));
const EditEvent = lazy(() => import("@/features/admin/pages/EditEvent"));
const ManageUsers = lazy(() => import("@/features/admin/pages/ManageUsers"));
const SponsorDashboard = lazy(() => import("@/features/admin/pages/SponsorDashboard"));
const ReportCenter = lazy(() => import("@/features/admin/pages/ReportCenter"));
const AdminSearch = lazy(() => import("@/features/admin/pages/AdminSearch"));
const AuditLogs = lazy(() => import("@/features/admin/pages/AuditLogs"));
const AdminRoleManager = lazy(() => import("@/features/admin/pages/AdminRoleManager"));

const SponsorInfo = lazy(() => import("@/features/Sponsor/pages/SponsorInfo"));
const SponsorApply = lazy(() => import("@/features/Sponsor/pages/SponsorApply"));

const NotFound = lazy(() => import("@/components/common/NotFound"));

// ── Stores & guards
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useStore as useAdultStore } from "@/features/Adult/stores/adult.store";
import useUiStore from "@/store/ui.store";

// Helper UI
const RouterError: React.FC = () => (
  <div style={{ padding: 24, textAlign: "center" }}>
    <h2 style={{ marginBottom: 8, fontSize: "1.5rem", fontWeight: "bold" }}>페이지를 불러올 수 없습니다.</h2>
    <p style={{ color: "#6b7280" }}>새로고침을 하거나 잠시 후 다시 시도해 주세요.</p>
  </div>
);

const PageFallback: React.FC = () => <div className="p-6 text-center text-gray-500">로딩 중.</div>;
const withSuspense = (node: React.ReactNode) => <Suspense fallback={<PageFallback />}>{node}</Suspense>;

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

// ✅ initialized 되기 전에는 절대 redirect 하지 말 것
const AuthProtectedRoute: React.FC = () => {
  const location = useLocation();
  const { initialized, loading, isLoggedIn } = useAuthStore();

  if (!initialized || loading) return <PageFallback />;
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
};

// ✅ 로그인/회원가입은 로그인 상태면 다시 밖으로 보내기
type PublicOnlyRouteProps = { children: React.ReactNode };
const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const location = useLocation();
  const { initialized, loading, isLoggedIn } = useAuthStore();

  if (!initialized || loading) return <PageFallback />;
  if (isLoggedIn) {
    const from = (location.state as any)?.from?.pathname;
    return <Navigate to={from || "/"} replace />;
  }
  return <>{children}</>;
};

// 관리자 보호 가드
type AdminProtectedRouteProps = { children?: React.ReactNode };
const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const location = useLocation();
  const { initialized, loading, isLoggedIn, user } = useAuthStore();

  if (!initialized || loading) return <PageFallback />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location }} />;

  // ✅ 단일 기준: custom claims
  const claims = user?.claims;
  const isAdmin = claims?.superAdmin === true || claims?.admin === true || claims?.isAdmin === true;

  // ❗여기서 "/"로 보내면 운영 디버깅이 힘듦 → forbidden으로 명확히
  return isAdmin ? (children ? <>{children}</> : <Outlet />) : <Navigate to="/forbidden" replace state={{ from: location }} />;
};

const ExplorerShell: React.FC = () => (
  <>
    <RouteModeWatcher />
    <MainLayout />
  </>
);

function AdultGatePage() {
  return (
    <MainLayout>
      <div className="p-20 text-center">
        <h2 className="text-2xl font-bold mb-4">성인 인증이 필요합니다</h2>
        <p>이 콘텐츠는 성인만 이용할 수 있습니다.</p>
      </div>
    </MainLayout>
  );
}

// Router Configuration
export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <ExplorerShell />,
      errorElement: <RouterError />,
      children: [
        { index: true, element: withSuspense(<Home />) },
        { path: "home", element: withSuspense(<Home />) },

        { path: "forbidden", element: withSuspense(<Forbidden />) },

        {
          path: "plan",
          element: withSuspense(<Plan />),
          children: [
            { path: "search", element: withSuspense(<PlanSearchOverlay />) },
            { path: "sample", element: withSuspense(<SampleChooser />) },
          ],
        },

        { path: "plan/share/:id", element: withSuspense(<PlanShareView />) },

        { path: "login", element: <PublicOnlyRoute>{withSuspense(<Login />)}</PublicOnlyRoute> },
        { path: "register", element: <PublicOnlyRoute>{withSuspense(<Register />)}</PublicOnlyRoute> },

        { path: "spots", element: withSuspense(<SpotsHome />) },
        { path: "spots/:spotId", element: withSuspense(<SpotDetailPage />) },

        { path: "events", element: withSuspense(<EventList />) },
        { path: "events/:eventId", element: withSuspense(<EventDetail />) },

        { path: "sponsor/info", element: withSuspense(<SponsorInfo />) },
        {
          element: <AuthProtectedRoute />,
          children: [{ path: "sponsor/apply", element: withSuspense(<SponsorApply />) }],
        },

        {
          element: <AuthProtectedRoute />,
          children: [
            { path: "profile", element: withSuspense(<Profile />) },
            {
              path: "mypage",
              element: <Outlet />,
              children: [
                { index: true, element: withSuspense(<MyPageHome />) },
                { path: "coupons", element: withSuspense(<MyCoupons />) },
                { path: "favorites", element: withSuspense(<MyFavorites />) },
                { path: "reviews", element: withSuspense(<MyReviews />) },
                { path: "settings", element: withSuspense(<Settings />) },
              ],
            },
          ],
        },
      ],
    },

    {
      path: "/admin",
      element: <AdminProtectedRoute>{withSuspense(<AdminLayout />)}</AdminProtectedRoute>,
      errorElement: <RouterError />,
      children: [
        { index: true, element: withSuspense(<AdminDashboard />) },
        { path: "spots", element: withSuspense(<AdminSpotList />) },
        { path: "spots/new", element: withSuspense(<AdminSpotForm />) },
        { path: "spots/:id/edit", element: withSuspense(<AdminSpotForm />) },

        { path: "events", element: withSuspense(<ManageEvents />) },
        { path: "events/new", element: withSuspense(<AddEvent />) },
        { path: "events/:id/edit", element: withSuspense(<EditEvent />) },

        { path: "users", element: withSuspense(<ManageUsers />) },
        { path: "roles", element: withSuspense(<AdminRoleManager />) },

        { path: "sponsors", element: withSuspense(<SponsorDashboard />) },
        { path: "reports", element: withSuspense(<ReportCenter />) },
        { path: "audit-logs", element: withSuspense(<AuditLogs />) },
        { path: "search", element: withSuspense(<AdminSearch />) },

        // ✅ /admin/* 잘못된 경로 → 빈화면 방지
        { path: "*", element: withSuspense(<NotFound />) },
      ],
    },

    { path: "/adult/gate", element: <AdultGatePage /> },
    {
      path: "/adult",
      element: <AdultLayout />,
      children: [
        {
          element: <NightlifeProtectedRoute />,
          children: [
            { index: true, element: withSuspense(<AdultHome />) },
            { path: "spots", element: withSuspense(<SpotsHome />) },
            { path: "spots/:spotId", element: withSuspense(<SpotDetailPage />) },
            { path: "events", element: withSuspense(<EventList />) },
            { path: "events/:eventId", element: withSuspense(<EventDetail />) },
          ],
        },
      ],
    },

    { path: "*", element: withSuspense(<NotFound />) },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_startTransition: true,
    },
  }
);

export default router;

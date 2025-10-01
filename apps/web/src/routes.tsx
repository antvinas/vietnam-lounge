import React, { Suspense } from "react";
import { Route, Routes as RouterRoutes, Navigate, Outlet } from "react-router-dom";

// 페이지
import Home from "./pages/Home/Home";
import SpotsHome from "./pages/Spots/SpotsHome";
import SpotDetailPage from "./pages/Spots/SpotDetailPage";
import BoardList from "./pages/Community/BoardList";
import CommunityNew from "./pages/Community/CommunityNew";
import EditPost from "./pages/Community/EditPost";
import PostDetail from "./pages/Community/PostDetail";
import EventList from "./pages/Events/EventList";
import EventDetail from "./pages/Events/EventDetail";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Profile from "./pages/User/Profile";
import MyPageHome from "./pages/MyPage/MyPageHome";
import MyCoupons from "./pages/MyPage/MyCoupons";
import MyFavorites from "./pages/MyPage/MyFavorites";
import MyPosts from "./pages/MyPage/MyPosts";
import Settings from "./pages/MyPage/Settings";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AddEvent from "./pages/Admin/AddEvent";
import AddNightlife from "./pages/Admin/AddNightlife";
import AddSpot from "./pages/Admin/AddSpot";
import ManageEvents from "./pages/Admin/ManageEvents";
import ManageUsers from "./pages/Admin/ManageUsers";

// ✅ Plan 관련
import PlanHome from "./pages/Plan/PlanHome";
import Planner from "./pages/Plan/Planner";
import PlanEditor from "./pages/Plan/PlanEditor";
import PlanShareView from "./pages/Plan/PlanShareView";

// 공통
import Loading from "./components/common/Loading";

// 새 레이아웃
import MainLayout from "./layout/MainLayout";
import AdultLayout from "./layout/AdultLayout";

// 스토어
import { useStore as useAdultStore } from "./store/adult.store";
import { useAuthStore } from "./store/auth.store";

/** 보호 라우트 */
const AgeProtectedRoute = () => {
  const { isAgeVerified } = useAdultStore();
  return isAgeVerified ? <Outlet /> : <Navigate to="/" replace />;
};

const AuthProtectedRoute = () => {
  const { isLoggedIn } = useAuthStore();
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

const AdminProtectedRoute = () => {
  const { user } = useAuthStore();
  return user && user.role === "admin" ? <Outlet /> : <Navigate to="/" replace />;
};

export const Routes = () => {
  return (
    <Suspense fallback={<Loading />}>
      <RouterRoutes>
        {/* ✅ Explorer/일반 레이아웃 */}
        <Route element={<MainLayout />}>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/spots" element={<SpotsHome />} />
          <Route path="/spots/:spotId" element={<SpotDetailPage />} />
          <Route path="/events" element={<EventList />} />
          <Route path="/events/:eventId" element={<EventDetail />} />

          {/* Plan */}
          <Route path="/plan" element={<PlanHome />} />
          <Route path="/plan/editor" element={<PlanEditor />} />
          <Route path="/plan/planner" element={<Planner />} />
          <Route path="/plan/:id/share" element={<PlanShareView />} />

          {/* Community */}
          <Route path="/community" element={<Outlet />}>
            <Route index element={<BoardList />} />
            <Route path="new" element={<CommunityNew />} />
            <Route path="edit/:postId" element={<EditPost />} />
            <Route path="post/:postId" element={<PostDetail />} />
          </Route>

          {/* Auth Required */}
          <Route element={<AuthProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/mypage" element={<Outlet />}>
              <Route index element={<MyPageHome />} />
              <Route path="coupons" element={<MyCoupons />} />
              <Route path="favorites" element={<MyFavorites />} />
              <Route path="posts" element={<MyPosts />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>

        {/* ✅ Nightlife 전용 레이아웃 */}
        <Route element={<AdultLayout />}>
          <Route element={<AgeProtectedRoute />}>
            <Route path="/nightlife" element={<Navigate to="spots" replace />} />
            <Route path="/nightlife/spots" element={<SpotsHome />} />
            <Route path="/nightlife/spots/:spotId" element={<SpotDetailPage />} />

            {/* Plan (야간 버전도 동일) */}
            <Route path="/nightlife/plan" element={<PlanHome />} />
            <Route path="/nightlife/plan/editor" element={<PlanEditor />} />
            <Route path="/nightlife/plan/planner" element={<Planner />} />
            <Route path="/nightlife/plan/:id/share" element={<PlanShareView />} />

            <Route path="/nightlife/events" element={<EventList />} />
            <Route path="/nightlife/events/:eventId" element={<EventDetail />} />

            {/* Community (Nightlife) */}
            <Route path="/nightlife/community" element={<Outlet />}>
              <Route index element={<BoardList />} />
              <Route path="new" element={<CommunityNew />} />
              <Route path="edit/:postId" element={<EditPost />} />
              <Route path="post/:postId" element={<PostDetail />} />
            </Route>
          </Route>
        </Route>

        {/* ✅ Admin */}
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<Outlet />}>
            <Route index element={<AdminDashboard />} />
            <Route path="add-event" element={<AddEvent />} />
            <Route path="add-nightlife" element={<AddNightlife />} />
            <Route path="add-spot" element={<AddSpot />} />
            <Route path="manage-events" element={<ManageEvents />} />
            <Route path="manage-users" element={<ManageUsers />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </RouterRoutes>
    </Suspense>
  );
};

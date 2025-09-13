
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes as RouterRoutes, Navigate, Outlet } from 'react-router-dom';
import Home from './pages/Home/Home';
import SpotsHome from './pages/Spots/SpotsHome';
import SpotDetail from './pages/Spots/SpotDetail';
import BoardList from './pages/Community/BoardList';
import NewPost from './pages/Community/NewPost';
import EditPost from './pages/Community/EditPost';
import PostDetail from './pages/Community/PostDetail';
import EventList from './pages/Events/EventList';
import EventDetail from './pages/Events/EventDetail';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
// import Nightlife from './pages/Nightlife/Nightlife';
// import NightlifeDetail from './pages/Nightlife/NightlifeDetail';
import Profile from './pages/User/Profile';
import MyPageHome from './pages/MyPage/MyPageHome';
import MyCoupons from './pages/MyPage/MyCoupons';
import MyFavorites from './pages/MyPage/MyFavorites';
import MyPosts from './pages/MyPage/MyPosts';
import Settings from './pages/MyPage/Settings';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AddEvent from './pages/Admin/AddEvent';
import AddNightlife from './pages/Admin/AddNightlife';
import AddSpot from './pages/Admin/AddSpot';
import ManageEvents from './pages/Admin/ManageEvents';
import ManageUsers from './pages/Admin/ManageUsers';
import { useStore as useAdultStore } from './store/adult.store';
import { useAuthStore } from './store/auth.store';
import Loading from './components/common/Loading';

// const AdultHome = lazy(() => import('./pages/Adult/AdultHome'));
// const AdultVerify = lazy(() => import('./pages/Adult/AdultVerify'));
// const Coupons = lazy(() => import('./pages/Adult/Coupons'));
// const AdultSpotDetail = lazy(() => import('./pages/Adult/AdultSpotDetail'));
// const CategoryList = lazy(() => import('./pages/Adult/CategoryList'));


const AgeProtectedRoute = () => {
  const { isAgeVerified } = useAdultStore();
  if (!isAgeVerified) {
    return <Navigate to="/adult-verify" replace />;
  }
  return <Outlet />;
};

const AuthProtectedRoute = () => {
  const { isLoggedIn } = useAuthStore();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />;
}

const AdminProtectedRoute = () => {
  const { user } = useAuthStore();
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return <Outlet />;
}

export const Routes = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <RouterRoutes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/spots" element={<SpotsHome />} />
          <Route path="/spots/:spotId" element={<SpotDetail />} />
          <Route path="/events" element={<EventList />} />
          <Route path="/events/:eventId" element={<EventDetail />} />

          {/* Community Routes */}
          <Route path="/community" element={<Outlet />}>
            <Route index element={<BoardList />} />
            <Route path="new" element={<NewPost />} />
            <Route path="edit/:postId" element={<EditPost />} />
            <Route path="post/:postId" element={<PostDetail />} />
          </Route>

          {/* Authenticated Routes */}
          <Route element={<AuthProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/mypage" element={<Outlet />} >
              <Route index element={<MyPageHome />} />
              <Route path="coupons" element={<MyCoupons />} />
              <Route path="favorites" element={<MyFavorites />} />
              <Route path="posts" element={<MyPosts />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Age Verification Route */}
          {/* <Route path="/adult-verify" element={<AdultVerify />} /> */}

          {/* Protected Routes for Adult Content */}
          {/* <Route path="/adult" element={<AgeProtectedRoute />}>
              <Route index element={<AdultHome />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="spots/:spotId" element={<AdultSpotDetail />} />
              <Route path=":category" element={<CategoryList />} />
              <Route path="community" element={<BoardList />} />
              <Route path="community/post/:postId" element={<PostDetail />} />
          </Route> */}

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminProtectedRoute />}>
            <Route index element={<AdminDashboard />} />
            <Route path="add-event" element={<AddEvent />} />
            <Route path="add-nightlife" element={<AddNightlife />} />
            <Route path="add-spot" element={<AddSpot />} />
            <Route path="manage-events" element={<ManageEvents />} />
            <Route path="manage-users" element={<ManageUsers />} />
          </Route>

          {/* Other Public Routes */}
          {/* <Route path="/nightlife" element={<Nightlife />} /> */}
          {/* <Route path="/nightlife/:id" element={<NightlifeDetail />} /> */}

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </RouterRoutes>
      </Suspense>
    </BrowserRouter>
  );
};

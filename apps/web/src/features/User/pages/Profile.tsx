// apps/web/src/features/User/pages/Profile.tsx
import { Navigate } from "react-router-dom";

// Profile 페이지는 MyPageHome으로 통합되었으므로 리다이렉트 처리
const Profile = () => {
  return <Navigate to="/mypage" replace />;
};

export default Profile;
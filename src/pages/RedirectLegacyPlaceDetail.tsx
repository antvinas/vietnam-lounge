import { Navigate, useParams } from "react-router-dom";
export default function RedirectLegacyPlaceDetail() {
    // 세부 페이지가 준비되면 여기서 /spot/:id로 넘기도록 바꾸면 됨
    // const { id } = useParams();
    return <Navigate to="/spots" replace />;
}

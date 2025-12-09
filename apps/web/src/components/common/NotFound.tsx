import { useNavigate, Link } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-3xl font-extrabold text-text-main">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-sm text-text-secondary">
        주소가 변경되었거나 삭제되었을 수 있습니다.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow hover:bg-primary-hover"
        >
          뒤로가기
        </button>
        <Link
          to="/"
          className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text-main hover:text-primary"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

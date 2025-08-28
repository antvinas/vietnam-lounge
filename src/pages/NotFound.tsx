// src/pages/NotFound.tsx
import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="grid place-items-center gap-3 py-20 text-center">
            <div className="text-3xl font-bold text-fg-title">404</div>
            <div className="text-fg-muted">페이지를 찾을 수 없습니다.</div>
            <Link className="text-brand-secondary underline" to="/">
                홈으로
            </Link>
        </div>
    );
}

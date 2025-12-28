// apps/web/src/features/admin/components/AdminLayout.tsx
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaChartPie,
  FaMapMarkedAlt,
  FaUsers,
  FaArrowLeft,
  FaSignOutAlt,
  FaCalendarAlt,
  FaAd,
  FaExclamationTriangle,
  FaBars,
  FaHome,
  FaUserCircle,
  FaPlus,
  FaUserShield,
  FaHistory,
  FaSearch,
} from "react-icons/fa";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import { getPendingReportCount } from "@/features/admin/api/admin.api";
import React, { useEffect, useMemo, useRef, useState } from "react";
import useUiStore from "@/store/ui.store";

type MenuItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
};

export default function AdminLayout() {
  const { pathname, search } = useLocation();
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [q, setQ] = useState("");

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { setContentMode } = useUiStore();

  // ✅ Admin 진입 시 contentMode를 explorer로 고정 (adult → admin 이동 시 모드 꼬임 방지)
  useEffect(() => {
    setContentMode("explorer");
  }, [setContentMode]);

  const { data: pendingReports = 0 } = useQuery({
    queryKey: ["admin", "pendingReportsCount"],
    queryFn: getPendingReportCount,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const menu = useMemo<MenuItem[]>(
    () => [
      { label: "대시보드", path: "/admin", icon: <FaChartPie /> },
      { label: "장소 관리", path: "/admin/spots", icon: <FaMapMarkedAlt /> },
      { label: "이벤트 관리", path: "/admin/events", icon: <FaCalendarAlt /> },
      { label: "회원 관리", path: "/admin/users", icon: <FaUsers /> },
      { label: "권한 관리", path: "/admin/roles", icon: <FaUserShield /> },
      { label: "광고/스폰서 관리", path: "/admin/sponsors", icon: <FaAd /> },
      { label: "작업 이력", path: "/admin/audit-logs", icon: <FaHistory /> },
      {
        label: "신고 관리",
        path: "/admin/reports",
        icon: <FaExclamationTriangle />,
        badge: pendingReports,
      },
    ],
    [pendingReports]
  );

  const pageTitle = useMemo(() => {
    if (pathname === "/admin") return "대시보드";
    if (pathname.startsWith("/admin/spots/new")) return "장소 등록";
    if (pathname.startsWith("/admin/spots/") && pathname.endsWith("/edit")) return "장소 수정";
    if (pathname.startsWith("/admin/spots")) return "장소 관리";

    if (pathname.startsWith("/admin/events/new")) return "이벤트 등록";
    if (pathname.startsWith("/admin/events/") && pathname.endsWith("/edit")) return "이벤트 수정";
    if (pathname.startsWith("/admin/events")) return "이벤트 관리";

    if (pathname.startsWith("/admin/users")) return "회원 관리";
    if (pathname.startsWith("/admin/roles")) return "권한 관리";
    if (pathname.startsWith("/admin/sponsors")) return "광고/스폰서 관리";
    if (pathname.startsWith("/admin/audit-logs")) return "작업 이력";
    if (pathname.startsWith("/admin/reports")) return "신고 관리";
    if (pathname.startsWith("/admin/search")) return "관리자 검색";
    return "관리자";
  }, [pathname]);

  const displayName = user?.displayName || (user?.email ? user.email.split("@")[0] : "관리자");

  // ✅ Admin은 "항상 라이트"로 고정 (html.dark 강제 해제 + 재주입 차단)
  // - Tailwind의 dark: variant는 html(.dark) 클래스에 의존하므로, Admin에서만 확실히 분리
  useEffect(() => {
    const root = document.documentElement;

    const hadDark = root.classList.contains("dark");
    const prevAdminAttr = root.getAttribute("data-admin");

    // Admin 진입 표시
    root.setAttribute("data-admin", "1");

    // 라이트 강제
    root.classList.remove("dark");

    // 다른 곳(App theme effect 등)에서 dark를 다시 넣더라도 즉시 제거
    const observer = new MutationObserver(() => {
      if (root.classList.contains("dark")) root.classList.remove("dark");
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();

      // Admin 표시 복구
      if (prevAdminAttr == null) root.removeAttribute("data-admin");
      else root.setAttribute("data-admin", prevAdminAttr);

      // 원래 다크였으면 복구 (Admin 종료 시 사용자 모드로 돌아가게)
      if (hadDark) root.classList.add("dark");
    };
  }, []);

  // ✅ 라우트 변경 시 모바일 사이드바 자동 닫기 (빈번한 운영 이동 UX)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // ✅ 모바일 사이드바 오픈 시 body 스크롤 잠금 + ESC로 닫기
  useEffect(() => {
    if (!sidebarOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sidebarOpen]);

  // ✅ /admin/search 에서는 URL의 q를 상단 검색창에 반영(UX 통일)
  useEffect(() => {
    if (!pathname.startsWith("/admin/search")) return;
    const sp = new URLSearchParams(search);
    const qq = (sp.get("q") || "").trim();
    setQ(qq);
  }, [pathname, search]);

  // ✅ 운영툴 편의: "/" 누르면 상단 검색 포커스
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || (target as any)?.isContentEditable;
      if (isTyping) return;

      e.preventDefault();
      searchInputRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigateSearch = (nextQ: string) => {
    const trimmed = nextQ.trim();
    if (!trimmed) return;

    if (pathname.startsWith("/admin/search")) {
      // 기존 탭/필터/정렬 유지하고 q만 교체
      const sp = new URLSearchParams(search);
      sp.set("q", trimmed);
      navigate(`/admin/search?${sp.toString()}`);
      return;
    }

    navigate(`/admin/search?q=${encodeURIComponent(trimmed)}`);
  };

  const isActiveMenu = (itemPath: string) => {
    if (itemPath === "/admin") return pathname === "/admin";
    return pathname.startsWith(itemPath);
  };

  const Sidebar = (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 shadow-xl z-20 h-full">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-lg">
          A
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">관리자 콘솔</h1>
          <p className="text-xs text-slate-400">VN Lounge 운영</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menu.map((item) => {
            const active = isActiveMenu(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${
                      active
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="flex items-center gap-3">
                    <span className={`text-lg ${active ? "text-white" : "text-slate-400"}`}>{item.icon}</span>
                    {item.label}
                  </span>

                  {item.badge != null && item.badge > 0 ? (
                    <span className="min-w-[22px] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
            <div className="w-full h-full bg-gray-500 flex items-center justify-center text-xs">U</div>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{displayName}</p>
            <p className="text-xs text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 접속 중
            </p>
          </div>
        </div>

        {/* ✅ Quick Actions: 운영툴 기본 */}
        <div className="space-y-2 mb-4">
          <Link
            to="/admin/spots/new"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <FaPlus /> 장소 등록
          </Link>

          <Link
            to="/admin/events/new"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <FaPlus /> 이벤트 등록
          </Link>
        </div>

        <div className="space-y-2">
          <Link
            to="/mypage"
            className="w-full flex items-center gap-3 px-4 py-2 text-xs text-slate-300 hover:text-white transition hover:bg-slate-800 rounded-lg"
          >
            <FaUserCircle /> 마이페이지
          </Link>

          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-2 text-xs text-slate-300 hover:text-white transition hover:bg-slate-800 rounded-lg"
          >
            <FaHome /> 메인
          </Link>

          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs text-red-400 hover:text-red-300 transition hover:bg-red-900/20 rounded-lg"
          >
            <FaSignOutAlt /> 로그아웃
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="admin-root flex h-screen bg-gray-100 overflow-hidden [color-scheme:light] text-slate-900">
      <div className="hidden lg:block">{Sidebar}</div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">{Sidebar}</div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
              aria-label="관리자 메뉴 열기"
            >
              <FaBars />
            </button>

            <div className="flex flex-col leading-tight">
              <h2 className="text-lg font-bold text-gray-800">{pageTitle}</h2>
              <span className="text-[11px] text-gray-400">운영/관리 기능</span>
            </div>

            {pendingReports > 0 && (
              <Link
                to="/admin/reports"
                className="ml-2 inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 hover:bg-red-100"
              >
                <FaExclamationTriangle />
                미처리 신고 {pendingReports > 99 ? "99+" : pendingReports}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* ✅ 상단 통합 검색 ("/" 키로 포커스) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigateSearch(q);
              }}
              className="hidden md:flex items-center gap-2"
              aria-label="관리자 통합 검색"
              title='"/" 키로 빠른 검색'
            >
              <div className="relative">
                <input
                  ref={searchInputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder='통합 검색 ("/"): 장소/이벤트/회원'
                  className="w-80 h-9 rounded-lg border border-gray-200 bg-white pl-3 pr-10 text-sm text-gray-900
                             placeholder:text-gray-400
                             outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100"
                  aria-label="검색"
                >
                  <FaSearch className="text-gray-500" />
                </button>
              </div>
            </form>

            {/* 모바일: 검색 버튼 */}
            <button
              type="button"
              onClick={() => navigate("/admin/search")}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200"
              aria-label="관리자 검색"
              title="관리자 검색"
            >
              <FaSearch className="text-gray-700" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="hidden sm:inline-flex items-center gap-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg"
            >
              <FaArrowLeft /> 메인
            </button>

            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">v1.0.0</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

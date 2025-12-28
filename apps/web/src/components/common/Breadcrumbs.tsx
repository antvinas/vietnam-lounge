import { Link, useLocation } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import React from "react";

type Resolver =
  | ((segment: string, index: number, parts: string[]) => string | { label: string; to?: string })
  | undefined;

interface BreadcrumbProps {
  /** URL 세그먼트 → 표시명 매핑 (예: { spots: "스팟", hanoi: "하노이" }) */
  pathMap?: Record<string, string>;
  /** 동적 세그먼트 표시명 커스텀(예: 상세페이지에서 spot.name 주입) */
  resolver?: Resolver;
  /** 구분자 커스텀 */
  separator?: React.ReactNode;
  /** 홈 아이콘 숨김 여부 */
  hideHome?: boolean;
  className?: string;
}

function titleize(s: string) {
  // slug/스네이크 → 사람이 읽는 형태
  return s
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function Breadcrumbs({
  pathMap = {},
  resolver,
  separator = <span className="mx-2 text-slate-500" aria-hidden="true">/</span>,
  hideHome = false,
  className = "",
}: BreadcrumbProps) {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);

  if (parts.length === 0 && hideHome) return null;

  return (
    <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
      <ol className="inline-flex list-none p-0 items-center flex-wrap">
        {!hideHome && (
          <li className="flex items-center">
            <Link
              to="/"
              aria-label="홈으로"
              className="text-slate-400 hover:text-emerald-300 focus:outline-none focus-visible:ring focus-visible:ring-emerald-400 rounded px-0.5"
            >
              <FaHome />
            </Link>
          </li>
        )}

        {parts.map((raw, idx) => {
          const seg = decodeURIComponent(raw);
          const to = `/${parts.slice(0, idx + 1).join("/")}`;
          const isLast = idx === parts.length - 1;

          let nodeLabel: string;
          let nodeTo: string | undefined = !isLast ? to : undefined;

          const resolved = resolver?.(seg, idx, parts);
          if (typeof resolved === "string") {
            nodeLabel = resolved;
          } else if (resolved && typeof resolved === "object") {
            nodeLabel = resolved.label;
            nodeTo = resolved.to ?? nodeTo;
          } else if (pathMap[seg]) {
            nodeLabel = pathMap[seg]!;
          } else {
            nodeLabel = titleize(seg);
          }

          return (
            <li key={to} className="flex items-center">
              {(!hideHome || idx > 0) && separator}
              {isLast || !nodeTo ? (
                <span
                  className="text-slate-200 font-semibold"
                  aria-current="page"
                >
                  {nodeLabel}
                </span>
              ) : (
                <Link
                  to={nodeTo}
                  className="text-slate-400 hover:text-emerald-300 focus:outline-none focus-visible:ring focus-visible:ring-emerald-400 rounded px-0.5"
                >
                  {nodeLabel}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

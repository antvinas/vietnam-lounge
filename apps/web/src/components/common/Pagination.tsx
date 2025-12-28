import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageItems(current: number, total: number) {
  // 예: [1, "...", 6,7,8, "...", 20]
  const items: Array<number | "..."> = [];
  const add = (x: number | "...") => items.push(x);

  if (total <= 7) {
    for (let i = 1; i <= total; i++) add(i);
    return items;
  }

  add(1);

  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);

  if (start > 2) add("...");

  for (let i = start; i <= end; i++) add(i);

  if (end < total - 1) add("...");

  add(total);

  return items;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const goPrev = () => currentPage > 1 && onPageChange(currentPage - 1);
  const goNext = () => currentPage < totalPages && onPageChange(currentPage + 1);

  if (totalPages <= 1) return null;

  const items = getPageItems(currentPage, totalPages);

  return (
    <nav className="mt-6 flex justify-center" aria-label="페이지네이션">
      <ul className="inline-flex items-center -space-x-px rounded-lg shadow-sm">
        <li>
          <button
            type="button"
            onClick={goPrev}
            disabled={currentPage === 1}
            aria-label="이전 페이지"
            className="ml-0 rounded-l-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            이전
          </button>
        </li>

        {items.map((it, idx) => {
          if (it === "...") {
            return (
              <li key={`ellipsis-${idx}`}>
                <span className="border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-400 select-none">
                  …
                </span>
              </li>
            );
          }

          const n = it;
          const isCurrent = n === currentPage;

          return (
            <li key={n}>
              <button
                type="button"
                onClick={() => onPageChange(n)}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`${n}페이지`}
                className={[
                  "border px-3 py-2 leading-tight",
                  isCurrent
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                {n}
              </button>
            </li>
          );
        })}

        <li>
          <button
            type="button"
            onClick={goNext}
            disabled={currentPage === totalPages}
            aria-label="다음 페이지"
            className="rounded-r-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            다음
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const pages = Array.from({ length: Math.max(totalPages, 0) }, (_, i) => i + 1);

  const goPrev = () => currentPage > 1 && onPageChange(currentPage - 1);
  const goNext = () => currentPage < totalPages && onPageChange(currentPage + 1);

  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex justify-center" aria-label="페이지네이션">
      <ul className="inline-flex items-center -space-x-px rounded-lg shadow-sm">
        <li>
          <button
            type="button"
            onClick={goPrev}
            disabled={currentPage === 1}
            aria-label="이전 페이지"
            className="ml-0 rounded-l-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-600 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            Previous
          </button>
        </li>

        {pages.map((n) => {
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
                    ? "border-blue-300 bg-blue-50 text-blue-700 dark:bg-gray-700 dark:text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
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
            className="rounded-r-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-600 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;

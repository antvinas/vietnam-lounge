// apps/web/src/components/community/FiltersBar.tsx
import { useCommunityStore } from "@/store/useCommunityStore";

const SORTS = [
  { id: "latest", name: "최신순" },
  { id: "hot", name: "인기순" },
  { id: "comments", name: "댓글순" },
  { id: "views", name: "조회순" },
];

export default function FiltersBar() {
  const { sort, setSort } = useCommunityStore();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {/* 정렬 버튼 그룹 */}
      {SORTS.map((s) => (
        <button
          key={s.id}
          onClick={() => setSort(s.id as any)}
          className={[
            "rounded-md px-3 py-1.5 text-sm font-medium transition",
            sort === s.id
              ? "bg-blue-500 text-white shadow"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200",
          ].join(" ")}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}

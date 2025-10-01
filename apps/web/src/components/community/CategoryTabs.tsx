// apps/web/src/components/community/CategoryTabs.tsx
import { useCommunityStore } from "@/store/useCommunityStore";
import {
  FaGlobe,
  FaUsers,
  FaUtensils,
  FaSpa,
  FaQuestion,
  FaStickyNote,
  FaCommentDots,
} from "react-icons/fa";

const CATEGORIES = [
  { id: "all", name: "전체", icon: <FaGlobe /> },
  { id: "여행이야기", name: "여행이야기", icon: <FaGlobe /> },
  { id: "동행모임", name: "동행모임", icon: <FaUsers /> },
  { id: "맛집후기", name: "맛집후기", icon: <FaUtensils /> },
  { id: "스파후기", name: "스파후기", icon: <FaSpa /> },
  { id: "Q&A", name: "Q&A", icon: <FaQuestion /> },
  { id: "꿀팁노트", name: "꿀팁노트", icon: <FaStickyNote /> },
  { id: "자유", name: "자유", icon: <FaCommentDots /> },
];

export default function CategoryTabs() {
  const { category, setCategory } = useCommunityStore();

  return (
    <div className="mb-4 overflow-x-auto">
      <div className="flex gap-2 min-w-max pb-1">
        {CATEGORIES.map((c) => {
          const active =
            category === c.id || (category === "all" && c.id === "all");
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={[
                "flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200",
              ].join(" ")}
            >
              {c.icon}
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

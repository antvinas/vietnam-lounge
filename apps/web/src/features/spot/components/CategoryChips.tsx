import useUiStore from "@/store/ui.store";

const CATEGORIES = [
  "전체",
  "호텔",
  "레스토랑",
  "카페 & 브런치",
  "스파 & 마사지",
  "관광 & 문화",
  "쇼핑",
  "액티비티",
];

export default function CategoryChips() {
  const { category, setCategory } = useUiStore();

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const active = category === c;
        return (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={
              active
                ? "rounded-full px-4 py-1.5 text-sm font-semibold text-white bg-primary shadow"
                : "rounded-full px-4 py-1.5 text-sm font-semibold text-text-secondary bg-background-sub hover:bg-background"
            }
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

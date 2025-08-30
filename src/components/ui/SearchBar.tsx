export default function SearchBar({
    value,
    onChange,
    placeholder = "도시/장소/태그 검색",
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary dark:bg-bg-muted"
        />
    );
}

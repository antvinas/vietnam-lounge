// src/components/LanguageSwitcher.tsx
import { useI18n } from "@/i18n";

export default function LanguageSwitcher() {
    const { lang, setLang } = useI18n();
    return (
        <select
            className="rounded-lg border border-border-subtle bg-white px-2 py-1 text-xs dark:bg-bg-muted"
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            aria-label="language"
            title="language"
        >
            <option value="ko">KO</option>
            <option value="en">EN</option>
            <option value="vi">VI</option>
        </select>
    );
}

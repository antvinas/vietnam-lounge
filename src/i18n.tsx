// src/i18n.tsx
import { createContext, useContext, useMemo, useState } from "react";

type Lang = "ko" | "en" | "vi";
type Dict = Record<string, string>;
type Resources = Record<Lang, Dict>;

const RES: Resources = {
    ko: {
        home_hot: "오늘의 도시별 핫스팟",
        new_reviews: "신규 후기",
        places: "여행 스팟",
        plans: "플랜",
        community: "커뮤니티",
        events: "이벤트",
        my: "마이",
        adult19: "성인 19+",
        login: "로그인",
        logout: "로그아웃",
        not_found: "페이지를 찾을 수 없습니다.",
    },
    en: {
        home_hot: "Today’s City Hotspots",
        new_reviews: "New Reviews",
        places: "Places",
        plans: "Plans",
        community: "Community",
        events: "Events",
        my: "My",
        adult19: "Adult 19+",
        login: "Log in",
        logout: "Log out",
        not_found: "Page not found.",
    },
    vi: {
        home_hot: "Điểm nóng theo thành phố hôm nay",
        new_reviews: "Đánh giá mới",
        places: "Địa điểm",
        plans: "Kế hoạch",
        community: "Cộng đồng",
        events: "Sự kiện",
        my: "Của tôi",
        adult19: "Người lớn 19+",
        login: "Đăng nhập",
        logout: "Đăng xuất",
        not_found: "Không tìm thấy trang.",
    },
};

type I18nCtx = {
    lang: Lang;
    t: (k: keyof typeof RES["ko"]) => string;
    setLang: (l: Lang) => void;
};

const Ctx = createContext<I18nCtx>({
    lang: "ko",
    t: (k) => RES.ko[k],
    setLang: () => { },
});

const LANG_KEY = "vl_lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState<Lang>(() => {
        const saved = typeof localStorage !== "undefined" ? (localStorage.getItem(LANG_KEY) as Lang | null) : null;
        return saved ?? "ko";
    });

    const t = (k: keyof typeof RES["ko"]) => RES[lang][k] ?? RES.ko[k];

    const value = useMemo(() => ({
        lang, t, setLang: (l: Lang) => {
            setLang(l);
            if (typeof localStorage !== "undefined") localStorage.setItem(LANG_KEY, l);
        }
    }), [lang]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

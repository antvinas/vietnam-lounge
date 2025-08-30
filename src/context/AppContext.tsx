// src/context/AppContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut as fbSignOut,
    User,
} from "firebase/auth";

type AppCtx = {
    // auth
    user: User | null;
    authReady: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;

    // bookmarks
    bookmarks: Set<string>;
    toggleBookmark: (id: string) => void;

    // adult gate
    adultAllowed: boolean;
    setAdultAllowed: (v: boolean) => void;
};

const CTX = createContext<AppCtx>({
    user: null,
    authReady: false,
    signIn: async () => { },
    signOut: async () => { },
    bookmarks: new Set(),
    toggleBookmark: () => { },
    adultAllowed: false,
    setAdultAllowed: () => { },
});

export const useApp = () => useContext(CTX);

const BM_KEY = "vl_bookmarks";
const ADULT_KEY = "vl_adult_allowed";

function loadBookmarks(): Set<string> {
    if (typeof localStorage === "undefined") return new Set();
    try {
        const raw = localStorage.getItem(BM_KEY);
        return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
        return new Set();
    }
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
    // auth
    const [user, setUser] = useState<User | null>(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u ?? null);
            setAuthReady(true);
        });
        return () => unsub();
    }, []);

    const signIn = async () => {
        await signInWithPopup(auth, googleProvider);
    };
    const signOut = async () => {
        await fbSignOut(auth);
    };

    // bookmarks
    const [bookmarks, setBookmarks] = useState<Set<string>>(loadBookmarks());
    const toggleBookmark = (id: string) => {
        setBookmarks((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            localStorage.setItem(BM_KEY, JSON.stringify(Array.from(next)));
            return next;
        });
    };

    // adult gate
    const [adultAllowed, setAdultAllowed] = useState<boolean>(() => {
        if (typeof localStorage === "undefined") return false;
        return localStorage.getItem(ADULT_KEY) === "1";
    });
    useEffect(() => {
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(ADULT_KEY, adultAllowed ? "1" : "0");
        }
    }, [adultAllowed]);

    const value = useMemo<AppCtx>(
        () => ({
            user,
            authReady,
            signIn,
            signOut,
            bookmarks,
            toggleBookmark,
            adultAllowed,
            setAdultAllowed,
        }),
        [user, authReady, bookmarks, adultAllowed]
    );

    return <CTX.Provider value={value}>{children}</CTX.Provider>;
}

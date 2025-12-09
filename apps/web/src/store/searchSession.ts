/* @file apps/web/src/store/searchSession.ts */
import { create } from "zustand";
import { PlaceLite } from "../utils/places";

export type TransportMode = "DRIVING" | "WALKING" | "TRANSIT" | "BICYCLING";

export type SearchFilters = {
  category: string | null;
  openNow: boolean;
  minRating: number | null;
  country: string[]; // ISO codes
};

type State = {
  q: string;
  mode: TransportMode;
  filters: SearchFilters;
  results: PlaceLite[];
  loading: boolean;
  error: string | null;
  recentQueries: string[];
};

type Actions = {
  setQ: (q: string) => void;
  setMode: (m: TransportMode) => void;
  setFilters: (f: Partial<SearchFilters>) => void;
  setResults: (r: PlaceLite[]) => void;
  setLoading: (b: boolean) => void;
  setError: (e: string | null) => void;
  pushRecent: (q: string) => void;
  clearResults: () => void;
  reset: () => void;
};

const initialFilters: SearchFilters = {
  category: null,
  openNow: false,
  minRating: null,
  country: ["VN"], // 기본 베트남
};

const persistKey = "vnl.search.session";

function loadPersist(): Partial<State> | null {
  try {
    const raw = window.localStorage.getItem(persistKey);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<State>;
  } catch {
    return null;
  }
}
function savePersist(get: () => State) {
  try {
    const s = get();
    const keep: Partial<State> = {
      q: s.q,
      mode: s.mode,
      filters: s.filters,
      recentQueries: s.recentQueries.slice(0, 10),
    };
    window.localStorage.setItem(persistKey, JSON.stringify(keep));
  } catch {}
}

export const useSearchSession = create<State & Actions>((set, get) => {
  const boot = loadPersist();
  const init: State = {
    q: boot?.q ?? "",
    mode: boot?.mode ?? "DRIVING",
    filters: boot?.filters ?? initialFilters,
    results: [],
    loading: false,
    error: null,
    recentQueries: boot?.recentQueries ?? [],
  };

  return {
    ...init,
    setQ: (q) => {
      set({ q });
      savePersist(get);
    },
    setMode: (m) => {
      set({ mode: m });
      savePersist(get);
    },
    setFilters: (f) => {
      set((s) => ({ filters: { ...s.filters, ...f } }));
      savePersist(get);
    },
    setResults: (r) => set({ results: r }),
    setLoading: (b) => set({ loading: b }),
    setError: (e) => set({ error: e }),
    pushRecent: (q) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      set((s) => {
        const next = [trimmed, ...s.recentQueries.filter((x) => x !== trimmed)];
        return { recentQueries: next.slice(0, 10) };
      });
      savePersist(get);
    },
    clearResults: () => set({ results: [] }),
    reset: () => {
      set({
        q: "",
        results: [],
        loading: false,
        error: null,
        filters: initialFilters,
      });
      savePersist(get);
    },
  };
});

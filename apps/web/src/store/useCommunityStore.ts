import { create } from "zustand";

type SortType = "latest" | "hot" | "comments" | "views";

interface CommunityState {
  category: string;
  region: string;
  tags: string[];
  sort: SortType;
  cursor: string | null;
  search: string;

  setCategory: (c: string) => void;
  setRegion: (r: string) => void;
  setTags: (t: string[]) => void;
  setSort: (s: SortType) => void;
  setCursor: (c: string | null) => void;
  setSearch: (q: string) => void;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  category: "all",
  region: "all",
  tags: [],
  sort: "latest",
  cursor: null,
  search: "",

  setCategory: (c) => set({ category: c }),
  setRegion: (r) => set({ region: r }),
  setTags: (t) => set({ tags: t }),
  setSort: (s) => set({ sort: s }),
  setCursor: (c) => set({ cursor: c }),
  setSearch: (q) => set({ search: q }),
}));

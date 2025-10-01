import { create } from 'zustand';
import type { TimelineBlock, PlanItem } from '@/types/plan';

interface PlanState {
  currentDate: string;              // YYYY-MM-DD
  blocks: TimelineBlock[];          // order 포함
  nightMode: boolean;
  setNightMode: (v: boolean) => void;
  setDate: (iso: string) => void;
  addItem: (item: PlanItem) => void;
  updateItem: (id: string, patch: Partial<PlanItem>) => void;
  reorder: (from: number, to: number) => void;
  setBlocks: (b: TimelineBlock[]) => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  currentDate: new Date().toISOString().slice(0,10),
  blocks: [
    { id: 's1', order: 0, title: '성당 방문', category:'spot', dateISO: new Date().toISOString().slice(0,10), startTime:'09:00', endTime:'10:00', lat:10.779, lng:106.699, flags:{} },
    { id: 's2', order: 1, title: '벤탄 시장', category:'spot', dateISO: new Date().toISOString().slice(0,10), startTime:'10:30', endTime:'11:30', lat:10.772, lng:106.698, flags:{} },
  ],
  nightMode: false,
  setNightMode: (v) => set({ nightMode: v }),
  setDate: (iso) => set({ currentDate: iso }),
  addItem: (item) => set(s => ({ blocks: [...s.blocks, item].sort((a,b)=>a.order-b.order) })),
  updateItem: (id, patch) => set(s => ({ blocks: s.blocks.map(b => b.id===id ? ({...b, ...patch}) as any : b) })),
  reorder: (from, to) => set(s => {
    const arr = [...s.blocks].sort((a,b)=>a.order-b.order);
    const [moved] = arr.splice(from,1);
    arr.splice(to,0,moved);
    return { blocks: arr.map((b,idx)=>({ ...b, order: idx })) };
  }),
  setBlocks: (b) => set({ blocks: b }),
}));

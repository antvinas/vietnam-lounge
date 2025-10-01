export type MoveMode = 'walk' | 'grab' | 'bus';

export interface PlanItem {
  id: string;
  order: number;
  title: string;
  category?: string;
  dateISO: string;             // YYYY-MM-DD
  startTime: string;           // "09:00"
  endTime: string;             // "10:30"
  lat?: number;
  lng?: number;
  spotId?: string;
  flags?: {
    breakTimeConflict?: boolean;
    lastOrderSoon?: boolean;
    rainRisk?: boolean;
    happyHour?: boolean;
  };
  memo?: string;
  cost?: number;
}

export interface MoveBlock {
  id: string;
  type: 'move';
  fromId: string;
  toId: string;
  mode: MoveMode;
  etaMin: number;
  cost?: number;
}

export type TimelineBlock = PlanItem | (MoveBlock & { order: number });

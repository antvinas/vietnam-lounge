// apps/web/src/features/admin/api/types.ts
// ✅ Admin API 공용 타입 모음 (프론트 단일 계약)

export type AdminMode = "explorer" | "nightlife";

export type ReportStatus = "pending" | "resolved" | "rejected" | "deleted";

export interface Report {
  id: string;
  reason?: string;
  description?: string;
  status?: ReportStatus;
  createdAt?: any;
  reportedBy?: string;
  targetType?: string;
  targetId?: string;
  targetContent?: {
    title?: string;
    content?: string;
    [k: string]: any;
  };
  note?: string;
  processedAt?: any;
  processedBy?: string;
}

export type AdminEventMode = AdminMode;

export type EventVisibility = "public" | "private";
export type EventStatus = "draft" | "scheduled" | "active" | "ended";

export interface AdminEventData {
  id?: string;
  mode: AdminEventMode;

  title: string;
  description?: string;
  location?: string;
  city?: string;
  category?: string;
  organizer?: string;

  imageUrl?: string;
  gallery?: string[];

  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD

  // ✅ 운영 필드
  isPublic?: boolean;
  visibility?: EventVisibility;
  status?: EventStatus;

  // 확장 필드 대비
  [k: string]: any;
}

/**
 * ✅ Cursor pagination for spots
 * - 서버: nextCursor를 내려주고, 다음 호출 때 cursor로 다시 보내는 구조
 * - cursor는 string(권장) 또는 객체로 입력 가능 (객체면 내부에서 안전하게 encode)
 */
export type AdminSpotCursor =
  | string
  | {
      sortAt: number | string;
      id: string;
    };

export interface AdminSpotFilter {
  mode: AdminMode;
  region?: string; // locationId
  category?: string;

  cursor?: AdminSpotCursor | null;
  limit?: number;

  // legacy
  page?: number;
}

export interface AuditLogItem {
  id: string;
  action: string;
  byUid?: string | null;
  byEmail?: string | null;
  createdAt?: any;
  data?: Record<string, any>;
}

export type SystemHealth = {
  status?: "healthy" | "unhealthy";
  timestamp?: string; // ISO
  uptime?: number; // seconds
  dbLatency?: number; // ms
  memory?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  recentErrors?: Array<{ message: string; at: string }>;

  // 레거시 호환
  apiOk?: boolean;
  firestoreOk?: boolean;
  checkedAt?: string;
};

export type ReportQueueItem = {
  id: string;
  type?: string;
  createdAt?: any;
  targetType?: string;
  targetId?: string;
  reason?: string;
  description?: string;
  priorityScore?: number;
  [k: string]: any;
};

export type ReportQueueResponse = {
  countPending: number;
  top: ReportQueueItem[];
};

export type AdminSearchTab = "all" | "spots" | "events" | "users";
export type AdminSearchSort = "relevance" | "recent";
export type AdminSearchModeFilter = AdminMode | "all";

export interface AdminSearchSpotItem {
  id: string;
  mode: AdminMode;
  name?: string;
  category?: string;
  address?: string;
  city?: string;
  locationId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AdminSearchEventItem {
  id: string;
  mode: AdminMode;
  title?: string;
  location?: string;
  city?: string;
  category?: string;
  date?: string;
  endDate?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AdminSearchUserItem {
  id: string; // uid
  email?: string;
  displayName?: string;
  role?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AdminSearchParams {
  q: string;
  tab?: AdminSearchTab;
  sort?: AdminSearchSort;
  mode?: AdminSearchModeFilter;
  role?: string;
  page?: number;
  limit?: number;
}

export interface AdminSearchTotals {
  all: number;
  spots: number;
  events: number;
  users: number;
}

export interface AdminSearchResponse {
  q: string;
  tab: AdminSearchTab;
  sort: AdminSearchSort;
  mode: AdminSearchModeFilter;
  role: string;
  page: number;
  limit: number;
  totals: AdminSearchTotals;
  items: {
    spots: AdminSearchSpotItem[];
    events: AdminSearchEventItem[];
    users: AdminSearchUserItem[];
  };
}

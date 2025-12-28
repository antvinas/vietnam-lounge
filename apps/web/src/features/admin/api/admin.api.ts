// apps/web/src/features/admin/api/admin.api.ts
// ✅ Admin 전용 API 계약(프론트 단일 진입점)
// NOTE: 유지보수성을 위해 도메인별 파일로 분리하고, 이 파일은 "재-export"만 수행합니다.

export * from "./types";

export * from "./dashboard/dashboard.api";
export * from "./system/system.api";
export * from "./reports/reports.api";
export * from "./search/search.api";
export * from "./spots/spots.api";
export * from "./events/events.api";
export * from "./sponsors/sponsors.api";
export * from "./users/users.api";

export * from "./audit/audit.api";

// firebase/functions/src/middlewares/requireAdmin.ts
import { Request, Response, NextFunction } from "express";
import { requireAuth } from "./requireAuth";

/**
 * ✅ 운영 정석: Admin 판정은 Custom Claims 기반 (단일 기준)
 * - admin: true  또는 superAdmin: true
 * - (legacy 호환) isAdmin: true 도 허용
 */
function isAdminByClaims(req: Request): boolean {
  const u: any = (req as any).user;
  if (!u) return false;
  return u.superAdmin === true || u.admin === true || u.isAdmin === true;
}

function isSuperAdminByClaims(req: Request): boolean {
  const u: any = (req as any).user;
  if (!u) return false;
  return u.superAdmin === true;
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (isAdminByClaims(req)) return next();
    return res.status(403).send({ error: "Forbidden", code: "auth/not-an-admin" });
  });
};

/**
 * ✅ superAdmin 전용 가드 (최소 권한 원칙)
 * - 권한 승격/삭제 등 위험 액션은 여기로 보호
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (isSuperAdminByClaims(req)) return next();
    return res.status(403).send({ error: "Forbidden", code: "auth/not-a-super-admin" });
  });
};

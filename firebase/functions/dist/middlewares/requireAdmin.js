"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const requireAuth_1 = require("./requireAuth");
/**
 * ✅ 운영 정석: Admin 판정은 Custom Claims 기반 (단일 기준)
 * - admin: true  또는 superAdmin: true
 * - (legacy 호환) isAdmin: true 도 허용 (setRole에서 같이 세팅)
 */
function isAdminByClaims(req) {
    const u = req.user;
    if (!u)
        return false;
    // requireAuth에서 verifyIdToken 결과(decodedToken)가 req.user로 들어옴
    return u.superAdmin === true || u.admin === true || u.isAdmin === true;
}
const requireAdmin = (req, res, next) => {
    (0, requireAuth_1.requireAuth)(req, res, () => {
        if (isAdminByClaims(req))
            return next();
        return res.status(403).send({ error: "Forbidden", code: "auth/not-an-admin" });
    });
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=requireAdmin.js.map
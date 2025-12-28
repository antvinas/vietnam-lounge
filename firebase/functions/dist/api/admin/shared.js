"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.countQuery = countQuery;
exports.countCollection = countCollection;
exports.getUserFromReq = getUserFromReq;
exports.isSuperAdmin = isSuperAdmin;
exports.writeAuditLog = writeAuditLog;
exports.queryAuditLogs = queryAuditLogs;
exports.isoToday = isoToday;
exports.collectionForMode = collectionForMode;
exports.toMillis = toMillis;
exports.normalizeText = normalizeText;
exports.tokenize = tokenize;
exports.buildSearchTokens = buildSearchTokens;
exports.scoreForRelevance = scoreForRelevance;
exports.readRecent = readRecent;
exports.trySearchByTokens = trySearchByTokens;
exports.extractUserRole = extractUserRole;
exports.extractUserStatus = extractUserStatus;
const admin = __importStar(require("firebase-admin"));
exports.db = admin.firestore();
// -------------------------------
// Helpers (shared)
// -------------------------------
async function countQuery(q) {
    var _c;
    try {
        const anyQ = q;
        if (typeof anyQ.count === "function") {
            const aggSnap = await anyQ.count().get();
            const data = (_c = aggSnap.data) === null || _c === void 0 ? void 0 : _c.call(aggSnap);
            if (data && typeof data.count === "number")
                return data.count;
        }
    }
    catch (_d) {
        // ignore -> fallback
    }
    const snap = await q.get();
    return snap.size;
}
async function countCollection(name) {
    return await countQuery(exports.db.collection(name));
}
function getUserFromReq(req) {
    return req.user || req.auth || null;
}
function isSuperAdmin(req) {
    const u = getUserFromReq(req);
    const claims = (u === null || u === void 0 ? void 0 : u.claims) || u || {};
    if ((claims === null || claims === void 0 ? void 0 : claims.superAdmin) === true)
        return true;
    // 이메일 allowlist도 쓰고 싶으면 env로 확장 가능
    const email = String((u === null || u === void 0 ? void 0 : u.email) || "").toLowerCase();
    const raw = String(process.env.SUPER_ADMIN_EMAILS || "").trim();
    if (!raw)
        return false;
    const allow = new Set(raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
    return allow.has(email);
}
function normalizeTargetType(v) {
    const s = String(v || "").toLowerCase();
    if (s === "event")
        return "event";
    if (s === "spot")
        return "spot";
    if (s === "report")
        return "report";
    if (s === "system")
        return "system";
    return "unknown";
}
/**
 * ✅ 기존 시그니처 유지: writeAuditLog(req, action, data)
 * - data에 { targetType, targetId, changedFields, before, after }가 있으면 top-level로 승격 저장
 * - 없으면 action prefix로 기본 추론(예: events.* -> targetType=event, targetId=data.id)
 */
async function writeAuditLog(req, action, data) {
    var _c, _d;
    try {
        const u = getUserFromReq(req);
        const inferredTargetType = String(action || "").startsWith("events.") ? "event" :
            String(action || "").startsWith("spots.") ? "spot" :
                String(action || "").startsWith("reports.") ? "report" :
                    String(action || "").startsWith("system.") ? "system" :
                        "unknown";
        const targetType = normalizeTargetType((data === null || data === void 0 ? void 0 : data.targetType) || inferredTargetType);
        const targetId = ((data === null || data === void 0 ? void 0 : data.targetId) ? String(data.targetId) : null) ||
            ((data === null || data === void 0 ? void 0 : data.id) ? String(data.id) : null) ||
            null;
        const changedFields = Array.isArray(data === null || data === void 0 ? void 0 : data.changedFields)
            ? data.changedFields.map((x) => String(x)).filter(Boolean)
            : null;
        const before = (_c = data === null || data === void 0 ? void 0 : data.before) !== null && _c !== void 0 ? _c : null;
        const after = (_d = data === null || data === void 0 ? void 0 : data.after) !== null && _d !== void 0 ? _d : null;
        // data payload는 기존처럼 남기되, meta는 제거한 "순수 data"도 같이 저장해줌(중복 토큰 최소화)
        const _e = (data || {}), { targetType: _tt, targetId: _tid, changedFields: _cf, before: _b, after: _a } = _e, rest = __rest(_e, ["targetType", "targetId", "changedFields", "before", "after"]);
        await exports.db.collection("admin_audit_logs").add({
            action,
            targetType,
            targetId,
            changedFields,
            before,
            after,
            data: rest,
            byUid: (u === null || u === void 0 ? void 0 : u.uid) || null,
            byEmail: (u === null || u === void 0 ? void 0 : u.email) || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (_f) {
        // audit 실패는 메인 동작 막지 않음
    }
}
/**
 * ✅ 공용: admin_audit_logs 조회(인덱스 없을 때도 fallback 동작)
 * - targetType/targetId가 있는 경우 where로 강하게 조회 시도
 * - 실패하거나 레거시면 최근 N개 읽고 메모리 필터링
 */
async function queryAuditLogs(params) {
    const lim = Math.max(1, Math.min(500, Number(params.limit || 50)));
    const targetType = params.targetType ? normalizeTargetType(params.targetType) : null;
    const targetId = params.targetId ? String(params.targetId) : null;
    const col = exports.db.collection("admin_audit_logs");
    // 1) 가장 권장: where + orderBy
    if (targetType && targetId) {
        try {
            const snap = await col
                .where("targetType", "==", targetType)
                .where("targetId", "==", targetId)
                .orderBy("createdAt", "desc")
                .limit(lim)
                .get();
            return snap;
        }
        catch (_c) {
            // index 부족 등 -> fallback
        }
    }
    // 2) fallback: 최근 N개 읽고 필터
    const fallbackRead = Math.max(lim, 300);
    const snap = await col.orderBy("createdAt", "desc").limit(fallbackRead).get();
    return snap;
}
function isoToday() {
    return new Date().toISOString().split("T")[0];
}
function collectionForMode(mode, kind) {
    if (kind === "spots")
        return mode === "nightlife" ? "adult_spots" : "spots";
    return mode === "nightlife" ? "adult_events" : "events";
}
function toMillis(v) {
    if (!v)
        return null;
    try {
        if (typeof v.toMillis === "function")
            return v.toMillis();
        if (typeof v.toDate === "function")
            return v.toDate().getTime();
        if (typeof v.seconds === "number")
            return v.seconds * 1000;
        if (typeof v._seconds === "number")
            return v._seconds * 1000;
        if (typeof v === "number")
            return v;
        if (typeof v === "string") {
            const d = new Date(v);
            return Number.isNaN(d.getTime()) ? null : d.getTime();
        }
    }
    catch (_c) {
        // ignore
    }
    return null;
}
function normalizeText(s) {
    return String(s || "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function tokenize(s) {
    const n = normalizeText(s);
    if (!n)
        return [];
    const parts = n.split(" ").map((x) => x.trim()).filter(Boolean);
    const out = [];
    const seen = new Set();
    for (const p of parts) {
        if (p.length < 2)
            continue;
        if (seen.has(p))
            continue;
        seen.add(p);
        out.push(p);
        if (out.length >= 10)
            break;
    }
    return out;
}
function buildSearchTokens(fields, max = 50) {
    const joined = fields
        .map((v) => (v == null ? "" : String(v)))
        .filter(Boolean)
        .join(" ");
    const n = normalizeText(joined);
    if (!n)
        return [];
    const parts = n.split(" ").map((x) => x.trim()).filter(Boolean);
    const out = [];
    const seen = new Set();
    for (const p of parts) {
        if (p.length < 2)
            continue;
        if (seen.has(p))
            continue;
        seen.add(p);
        out.push(p);
        if (out.length >= max)
            break;
    }
    return out;
}
function scoreForRelevance(hay, q, tokens) {
    const h = normalizeText(hay);
    const nq = normalizeText(q);
    if (!h || !nq)
        return 0;
    let score = 0;
    if (h === nq)
        score += 120;
    if (h.startsWith(nq))
        score += 90;
    if (h.includes(nq))
        score += 60;
    for (const t of tokens) {
        if (h.includes(t))
            score += 10;
    }
    return score;
}
async function readRecent(colName, max = 300) {
    const col = exports.db.collection(colName);
    try {
        return await col.orderBy("updatedAt", "desc").limit(max).get();
    }
    catch (_c) {
        try {
            return await col.orderBy("createdAt", "desc").limit(max).get();
        }
        catch (_d) {
            return await col.limit(max).get();
        }
    }
}
async function trySearchByTokens(colName, tokens, max = 200) {
    if (!tokens.length)
        return null;
    const col = exports.db.collection(colName);
    try {
        // ⚠️ searchTokens가 없는 문서는 매칭이 안 됨 -> 결과가 비면 fallback 해야 함
        const q = col.where("searchTokens", "array-contains-any", tokens.slice(0, 10)).limit(max);
        const snap = await q.get();
        return snap;
    }
    catch (_c) {
        return null;
    }
}
function extractUserRole(u) {
    const roles = (u === null || u === void 0 ? void 0 : u.roles) || {};
    if ((roles === null || roles === void 0 ? void 0 : roles.superAdmin) === true || (u === null || u === void 0 ? void 0 : u.superAdmin) === true)
        return "superAdmin";
    if ((roles === null || roles === void 0 ? void 0 : roles.admin) === true || (u === null || u === void 0 ? void 0 : u.isAdmin) === true || (u === null || u === void 0 ? void 0 : u.admin) === true || (u === null || u === void 0 ? void 0 : u.role) === "admin")
        return "admin";
    return String((u === null || u === void 0 ? void 0 : u.role) || "member");
}
function extractUserStatus(u) {
    const s = String((u === null || u === void 0 ? void 0 : u.status) || "");
    if (!s)
        return "active";
    return s;
}
//# sourceMappingURL=shared.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRole = void 0;
// firebase/functions/src/callables/setRole.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0)
    admin.initializeApp();
function normalizeRole(roleRaw) {
    const r = String(roleRaw || "").toLowerCase().trim();
    if (r === "user")
        return "user";
    if (r === "admin")
        return "admin";
    if (r === "superadmin" || r === "super_admin" || r === "super-admin")
        return "superAdmin";
    throw new functions.https.HttpsError("invalid-argument", "role must be user|admin|superAdmin");
}
function isSuperAdmin(context) {
    var _a, _b;
    const token = (_b = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.token) !== null && _b !== void 0 ? _b : {};
    return token.superAdmin === true;
}
function isAdminOrSuperAdmin(context) {
    var _a, _b;
    const token = (_b = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.token) !== null && _b !== void 0 ? _b : {};
    return token.admin === true || token.superAdmin === true || token.isAdmin === true;
}
function parseCsvEmails(raw) {
    const set = new Set();
    const s = String(raw || "").trim();
    if (!s)
        return set;
    s.split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
        .forEach((x) => set.add(x));
    return set;
}
// ✅ 운영: 서버 환경변수/함수 config로만 bootstrap allowlist 관리
function getBootstrapAllowlist() {
    var _a, _b, _c, _d;
    const cfg = ((_a = functions.config) === null || _a === void 0 ? void 0 : _a.call(functions)) || {};
    const fromConfig = ((_b = cfg === null || cfg === void 0 ? void 0 : cfg.bootstrap) === null || _b === void 0 ? void 0 : _b.super_admin_emails) ||
        ((_c = cfg === null || cfg === void 0 ? void 0 : cfg.bootstrap) === null || _c === void 0 ? void 0 : _c.superadmin_emails) ||
        ((_d = cfg === null || cfg === void 0 ? void 0 : cfg.bootstrap) === null || _d === void 0 ? void 0 : _d.emails);
    const fromEnv = process.env.BOOTSTRAP_SUPERADMIN_EMAILS ||
        process.env.BOOTSTRAP_SUPER_ADMIN_EMAILS ||
        process.env.SUPERADMIN_BOOTSTRAP_EMAILS;
    return parseCsvEmails(fromConfig || fromEnv || "");
}
const BOOTSTRAP_DOC = admin.firestore().collection("_system").doc("admin_bootstrap");
async function isBootstrapLocked() {
    var _a;
    const snap = await BOOTSTRAP_DOC.get();
    if (!snap.exists)
        return false;
    return ((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.locked) === true;
}
async function lockBootstrap(actorUid, actorEmail) {
    await BOOTSTRAP_DOC.set({
        locked: true,
        actorUid,
        actorEmail,
        at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}
async function resolveTargetUser(payload) {
    var _a, _b;
    const targetUid = (payload.targetUid || payload.uid || "").trim();
    const email = (payload.email || "").trim().toLowerCase();
    if (targetUid) {
        const user = await admin.auth().getUser(targetUid);
        return { uid: user.uid, email: (_a = user.email) !== null && _a !== void 0 ? _a : null };
    }
    if (email) {
        const user = await admin.auth().getUserByEmail(email);
        return { uid: user.uid, email: (_b = user.email) !== null && _b !== void 0 ? _b : null };
    }
    throw new functions.https.HttpsError("invalid-argument", "uid(targetUid) or email is required");
}
async function getCurrentClaims(uid) {
    var _a;
    const user = await admin.auth().getUser(uid);
    const claims = ((_a = user.customClaims) !== null && _a !== void 0 ? _a : {});
    return { user, claims };
}
function buildNextClaims(role, prev) {
    const next = Object.assign({}, prev);
    if (role === "user") {
        next.admin = false;
        next.superAdmin = false;
        next.role = "user";
    }
    else if (role === "admin") {
        next.admin = true;
        next.superAdmin = false;
        next.role = "admin";
    }
    else {
        next.admin = true; // ✅ superAdmin은 admin 포함
        next.superAdmin = true;
        next.role = "superAdmin";
    }
    // legacy 호환
    next.isAdmin = next.admin === true || next.superAdmin === true;
    return next;
}
exports.setRole = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    }
    const role = normalizeRole(data === null || data === void 0 ? void 0 : data.role);
    const reason = ((data === null || data === void 0 ? void 0 : data.reason) || "").trim() || null;
    const target = await resolveTargetUser(data);
    const targetUid = target.uid;
    const actorUid = context.auth.uid;
    const actorEmail = String(((_a = context.auth.token) === null || _a === void 0 ? void 0 : _a.email) || "").toLowerCase() || null;
    // ✅ Bootstrap 조건: (1) superAdmin 요청, (2) 자기 자신만, (3) 서버 allowlist 이메일, (4) 아직 lock 안 걸림
    const allow = getBootstrapAllowlist();
    const canBootstrap = role === "superAdmin" &&
        actorUid === targetUid &&
        !!actorEmail &&
        allow.has(actorEmail) &&
        !(await isBootstrapLocked());
    // 운영 정책: superAdmin만 role 변경 가능
    if (!isSuperAdmin(context) && !canBootstrap) {
        throw new functions.https.HttpsError("permission-denied", "superAdmin only");
    }
    // 자기 자신 superAdmin 해제 방지 (잠금 사고 방지)
    if (actorUid === targetUid && role !== "superAdmin") {
        throw new functions.https.HttpsError("failed-precondition", "You cannot remove your own superAdmin. Assign another superAdmin first.");
    }
    const { user: targetUser, claims: prevClaims } = await getCurrentClaims(targetUid);
    const prevRole = (_b = prevClaims === null || prevClaims === void 0 ? void 0 : prevClaims.role) !== null && _b !== void 0 ? _b : ((prevClaims === null || prevClaims === void 0 ? void 0 : prevClaims.superAdmin) ? "superAdmin" : (prevClaims === null || prevClaims === void 0 ? void 0 : prevClaims.admin) || (prevClaims === null || prevClaims === void 0 ? void 0 : prevClaims.isAdmin) ? "admin" : "user");
    const nextClaims = buildNextClaims(role, prevClaims);
    await admin.auth().setCustomUserClaims(targetUid, nextClaims);
    // (표시용) users/{uid} 업데이트 (권한 판정엔 사용 금지)
    try {
        await admin
            .firestore()
            .collection("users")
            .doc(targetUid)
            .set({
            role: role === "superAdmin" ? "admin" : role,
            roleClaims: role,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: actorUid,
        }, { merge: true });
    }
    catch (_l) {
        // ignore
    }
    // ✅ bootstrap 성공 시 lock
    if (canBootstrap) {
        await lockBootstrap(actorUid, actorEmail);
    }
    // 감사 로그
    await admin.firestore().collection("admin_audit").add({
        action: "setRole",
        bootstrapped: canBootstrap,
        actorUid,
        actorEmail,
        actorIsAdmin: isAdminOrSuperAdmin(context),
        actorIsSuperAdmin: isSuperAdmin(context),
        targetUid,
        targetEmail: targetUser.email || null,
        prevRole,
        nextRole: role,
        reason,
        prevClaims: {
            admin: (_c = prevClaims === null || prevClaims === void 0 ? void 0 : prevClaims.admin) !== null && _c !== void 0 ? _c : false,
            superAdmin: (_d = prevClaims === null || prevClaims === void 0 ? void 0 : prevClaims.superAdmin) !== null && _d !== void 0 ? _d : false,
            isAdmin: (_e = prevClaims === null || prevClaims === void 0 ? void 0 : prevClaims.isAdmin) !== null && _e !== void 0 ? _e : false,
            role: (_f = prevClaims === null || prevClaims === void 0 ? void 0 : prevClaims.role) !== null && _f !== void 0 ? _f : null,
        },
        nextClaims: {
            admin: (_g = nextClaims.admin) !== null && _g !== void 0 ? _g : false,
            superAdmin: (_h = nextClaims.superAdmin) !== null && _h !== void 0 ? _h : false,
            isAdmin: (_j = nextClaims.isAdmin) !== null && _j !== void 0 ? _j : false,
            role: (_k = nextClaims.role) !== null && _k !== void 0 ? _k : null,
        },
        at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true, targetUid, role, prevRole, bootstrapped: canBootstrap };
});
//# sourceMappingURL=setRole.js.map
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
// firebase/functions/src/api/admin/users.router.ts
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const validate_1 = require("../../middlewares/validate");
const shared_1 = require("./shared");
const router = express.Router();
// ==========================================
router.get("/", async (_req, res) => {
    try {
        let snapshot;
        try {
            snapshot = await shared_1.db.collection("users").orderBy("createdAt", "desc").limit(50).get();
        }
        catch (_a) {
            try {
                snapshot = await shared_1.db.collection("users").orderBy("updatedAt", "desc").limit(50).get();
            }
            catch (_b) {
                snapshot = await shared_1.db.collection("users").limit(50).get();
            }
        }
        const users = snapshot.docs.map((d) => (Object.assign({ id: d.id }, d.data())));
        return res.status(200).send(users);
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error: "Failed to fetch users" });
    }
});
const PatchUserRoleSchema = zod_1.z.object({
    admin: zod_1.z.boolean(),
    superAdmin: zod_1.z.boolean().optional(),
});
router.patch("/:uid/role", (0, validate_1.validate)(PatchUserRoleSchema), async (req, res) => {
    if (!(0, shared_1.isSuperAdmin)(req))
        return res.status(403).send({ error: "Only super admin can change roles" });
    const { uid } = req.params;
    const { admin: isAdmin, superAdmin } = req.body;
    try {
        const record = await admin.auth().getUser(uid);
        const existing = (record.customClaims || {});
        const next = Object.assign({}, existing);
        if (!isAdmin) {
            delete next.admin;
            delete next.superAdmin;
        }
        else {
            next.admin = true;
            if (typeof superAdmin === "boolean") {
                if (superAdmin)
                    next.superAdmin = true;
                else
                    delete next.superAdmin;
            }
        }
        await admin.auth().setCustomUserClaims(uid, next);
        await shared_1.db.collection("users").doc(uid).set({
            isAdmin: Boolean(next.admin),
            roles: { admin: Boolean(next.admin), superAdmin: Boolean(next.superAdmin) },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        await (0, shared_1.writeAuditLog)(req, "users.role.patch", { uid, next });
        return res.status(200).send({ ok: true });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to update user role" });
    }
});
const PatchUserStatusSchema = zod_1.z.object({
    active: zod_1.z.boolean(),
    memo: zod_1.z.string().max(500).optional(),
});
router.patch("/:uid/status", (0, validate_1.validate)(PatchUserStatusSchema), async (req, res) => {
    const { uid } = req.params;
    const { active, memo } = req.body;
    try {
        await admin.auth().updateUser(uid, { disabled: !active });
        await shared_1.db.collection("users").doc(uid).set({
            status: active ? "active" : "banned",
            adminMemo: memo !== null && memo !== void 0 ? memo : null,
            bannedAt: active ? null : admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        await (0, shared_1.writeAuditLog)(req, "users.status.patch", { uid, active, memo: memo || null });
        return res.status(200).send({ ok: true });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to update user status" });
    }
});
router.delete("/:uid", async (req, res) => {
    if (!(0, shared_1.isSuperAdmin)(req))
        return res.status(403).send({ error: "Only super admin can delete users" });
    const { uid } = req.params;
    try {
        await shared_1.db.collection("users").doc(uid).delete().catch(() => null);
        await admin.auth().deleteUser(uid);
        await (0, shared_1.writeAuditLog)(req, "users.delete", { uid });
        return res.status(200).send({ ok: true });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to delete users" });
    }
});
exports.default = router;
//# sourceMappingURL=users.router.js.map
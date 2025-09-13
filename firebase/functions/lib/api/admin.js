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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const requireAdmin_1 = require("../middlewares/requireAdmin");
const router = express.Router();
const db = admin.firestore();
// All routes in this file are protected and can only be accessed by admins.
router.use(requireAdmin_1.requireAdmin);
// GET /admin/analytics/overview
router.get('/analytics/overview', async (req, res) => {
    try {
        // Example: Fetching total user and post counts
        const usersSnapshot = await db.collection('users').get();
        const postsSnapshot = await db.collection('posts').get();
        const overview = {
            totalUsers: usersSnapshot.size,
            totalPosts: postsSnapshot.size,
            // You can add more KPIs here as defined in the guide (dau, revenue, etc.)
        };
        res.status(200).send(overview);
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to fetch analytics overview.' });
    }
});
// GET /admin/users/list
router.get('/users/list', async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(users);
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to fetch user list.' });
    }
});
// --- Add other admin-related endpoints here ---
// e.g., GET /admin/reports/list
exports.adminRouter = router;
//# sourceMappingURL=admin.js.map
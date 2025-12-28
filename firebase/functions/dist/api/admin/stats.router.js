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
// firebase/functions/src/api/admin/stats.router.ts
const express = __importStar(require("express"));
const shared_1 = require("./shared");
const router = express.Router();
// GET /admin/stats
// -------------------------------
router.get("/", async (_req, res) => {
    try {
        const [userCount, spots1, spots2, events1, events2] = await Promise.all([
            (0, shared_1.countCollection)("users"),
            (0, shared_1.countCollection)("spots"),
            (0, shared_1.countCollection)("adult_spots"),
            (0, shared_1.countCollection)("events"),
            (0, shared_1.countCollection)("adult_events"),
        ]);
        const [sponsor1, sponsor2] = await Promise.all([
            (0, shared_1.countQuery)(shared_1.db.collection("spots").where("isSponsored", "==", true)),
            (0, shared_1.countQuery)(shared_1.db.collection("adult_spots").where("isSponsored", "==", true)),
        ]);
        return res.status(200).send({
            userCount,
            spotCount: spots1 + spots2,
            eventCount: events1 + events2,
            sponsorCount: sponsor1 + sponsor2,
        });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to fetch dashboard stats" });
    }
});
exports.default = router;
//# sourceMappingURL=stats.router.js.map
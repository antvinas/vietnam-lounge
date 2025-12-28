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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// firebase/functions/src/api/admin/index.ts
const express = __importStar(require("express"));
const requireAdmin_1 = require("../../middlewares/requireAdmin");
const stats_router_1 = __importDefault(require("./stats.router"));
const search_router_1 = __importDefault(require("./search.router"));
const reports_router_1 = __importDefault(require("./reports.router"));
const audit_router_1 = __importDefault(require("./audit.router"));
const users_router_1 = __importDefault(require("./users.router"));
const spots_router_1 = __importDefault(require("./spots.router"));
const events_router_1 = __importDefault(require("./events.router"));
const sponsors_router_1 = __importDefault(require("./sponsors.router"));
const system_router_1 = __importDefault(require("./system.router"));
const router = express.Router();
// auth guard for ALL admin APIs
router.use(requireAdmin_1.requireAdmin);
// sub-routers (B안: prefix 기반 구조)
router.use("/stats", stats_router_1.default);
router.use("/search", search_router_1.default);
router.use("/reports", reports_router_1.default);
router.use("/audit-logs", audit_router_1.default);
router.use("/users", users_router_1.default);
router.use("/spots", spots_router_1.default);
router.use("/events", events_router_1.default);
router.use("/sponsors", sponsors_router_1.default);
router.use("/system", system_router_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map
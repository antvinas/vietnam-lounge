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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCreateUser = exports.api = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const logger_1 = require("./utils/logger");
const community_1 = require("./api/community");
const spots_1 = require("./api/spots");
const admin_1 = require("./api/admin");
const events_1 = require("./api/events");
const users_1 = require("./api/users");
const uploads_1 = require("./api/uploads");
const auth_1 = require("./triggers/auth");
// Initialize Firebase Admin SDK (safely)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
// Initialize Express app
const app = (0, express_1.default)();
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: true })); // Configure for your specific domain in production
app.use(express_1.default.json());
// API Routers
app.use('/community', community_1.communityRouter);
app.use('/spots', spots_1.spotsRouter);
app.use('/admin', admin_1.adminRouter);
app.use('/events', events_1.eventsRouter);
app.use('/users', users_1.usersRouter);
app.use('/uploads', uploads_1.uploadsRouter);
// Generic error handler
app.use((err, req, res, next) => {
    logger_1.logger.error('Unhandled error:', err);
    res.status(500).send({ error: 'An unexpected error occurred.' });
});
// Expose the Express API as a single Cloud Function
exports.api = functions.https.onRequest(app);
// --- Function Triggers ---
exports.onCreateUser = functions.region('asia-northeast3').auth.user().onCreate(auth_1.handleCreateUser);
//# sourceMappingURL=index.js.map
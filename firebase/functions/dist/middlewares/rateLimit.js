"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.publicLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// 1. 일반 API 요청 제한 (15분에 100회)
exports.publicLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15분
    limit: 100, // max 대신 limit 사용 (v7 변경사항)
    standardHeaders: true, // RateLimit 헤더 표준 사용
    legacyHeaders: false, // X-RateLimit 헤더 비활성화
    // ✅ [핵심] IPv6 에러 해결을 위한 설정
    validate: {
        xForwardedForHeader: false,
        default: false
    },
    // 키 생성 로직 (IP 또는 유저 ID 기준)
    keyGenerator: (req) => {
        var _a;
        return ((_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.uid) || req.ip || "unknown-ip";
    },
});
// 2. 인증 관련 요청 제한 (로그인/회원가입 등, 1시간에 20회)
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1시간
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    // ✅ [핵심] IPv6 에러 해결을 위한 설정
    validate: {
        xForwardedForHeader: false,
        default: false
    },
    keyGenerator: (req) => {
        var _a;
        return ((_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.uid) || req.ip || "unknown-ip";
    },
});
//# sourceMappingURL=rateLimit.js.map
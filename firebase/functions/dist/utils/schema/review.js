"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewReportSchema = exports.ReviewListQuerySchema = exports.ReviewCreateSchema = void 0;
const zod_1 = require("zod");
exports.ReviewCreateSchema = zod_1.z.object({
    spotId: zod_1.z.string().min(1),
    rating: zod_1.z.number().int().min(1).max(5),
    content: zod_1.z.string().min(10).max(3000),
    photos: zod_1.z.array(zod_1.z.string().url()).max(8).optional(),
    nickname: zod_1.z.string().max(30).optional(),
});
exports.ReviewListQuerySchema = zod_1.z.object({
    spotId: zod_1.z.string().min(1),
    sort: zod_1.z.enum(["latest", "highest", "lowest"]).optional().default("latest"),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(20),
});
exports.ReviewReportSchema = zod_1.z.object({
    spotId: zod_1.z.string().min(1),
    reviewId: zod_1.z.string().min(1),
    reason: zod_1.z.string().max(200).optional(),
});
//# sourceMappingURL=review.js.map
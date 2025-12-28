"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAge = void 0;
const requireAge = (req, res, next) => {
    var _a, _b;
    const user = req.user;
    const ok = Boolean(user === null || user === void 0 ? void 0 : user.ageVerified) ||
        Boolean(user === null || user === void 0 ? void 0 : user.adult) ||
        Boolean((_a = user === null || user === void 0 ? void 0 : user.claims) === null || _a === void 0 ? void 0 : _a.ageVerified) ||
        Boolean((_b = user === null || user === void 0 ? void 0 : user.claims) === null || _b === void 0 ? void 0 : _b.adult);
    if (!ok) {
        res.status(403).send({ error: "AgeVerificationRequired" });
        return;
    }
    next();
};
exports.requireAge = requireAge;
//# sourceMappingURL=requireAge.js.map
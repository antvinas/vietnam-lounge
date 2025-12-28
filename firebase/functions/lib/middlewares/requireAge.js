"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAge = void 0;
const requireAge = (req, res, next) => {
    const user = req.user;
    const ok = Boolean(user?.ageVerified) ||
        Boolean(user?.adult) ||
        Boolean(user?.claims?.ageVerified) ||
        Boolean(user?.claims?.adult);
    if (!ok)
        return res.status(403).send({ error: "AgeVerificationRequired" });
    next();
};
exports.requireAge = requireAge;
//# sourceMappingURL=requireAge.js.map
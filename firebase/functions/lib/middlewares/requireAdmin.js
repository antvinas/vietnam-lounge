"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const requireAuth_1 = require("./requireAuth");
/**
 * A middleware that chains after `requireAuth` to check for admin custom claims.
 * If the user is not an admin, it sends a 403 Forbidden response.
 */
const requireAdmin = (req, res, next) => {
    (0, requireAuth_1.requireAuth)(req, res, () => {
        if (req.user?.admin === true) {
            return next();
        }
        else {
            return res.status(403).send({ error: 'Forbidden', code: 'auth/not-an-admin' });
        }
    });
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=requireAdmin.js.map
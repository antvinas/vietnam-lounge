"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema, where = "query") => (req, res, next) => {
    const data = where === "body" ? req.body : where === "params" ? req.params : req.query;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        return res.status(400).send({ error: "ValidationError", issues: parsed.error.flatten() });
    }
    // attach parsed
    req._validated = { ...req._validated, [where]: parsed.data };
    next();
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map
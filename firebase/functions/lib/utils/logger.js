"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const firebase_functions_1 = require("firebase-functions");
// You can expand this logger with more advanced capabilities like logging to other services.
const log = (...args) => {
    firebase_functions_1.logger.log(...args);
};
const info = (...args) => {
    firebase_functions_1.logger.info(...args);
};
const warn = (...args) => {
    firebase_functions_1.logger.warn(...args);
};
const error = (...args) => {
    firebase_functions_1.logger.error(...args);
};
exports.logger = {
    log,
    info,
    warn,
    error,
};
//# sourceMappingURL=logger.js.map
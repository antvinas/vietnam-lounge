import {logger as firebaseLogger} from "firebase-functions";

// You can expand this logger with more advanced capabilities like logging to other services.

const log = (...args: any[]) => {
  firebaseLogger.log(...args);
};

const info = (...args: any[]) => {
  firebaseLogger.info(...args);
};

const warn = (...args: any[]) => {
  firebaseLogger.warn(...args);
};

const error = (...args: any[]) => {
  firebaseLogger.error(...args);
};

export const logger = {
  log,
  info,
  warn,
  error,
};

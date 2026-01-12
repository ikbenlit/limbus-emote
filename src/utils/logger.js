import { CONFIG } from '../config.js';

const shouldLog = () => Boolean(CONFIG.debug?.enabled);

export const logger = {
  log: (...args) => {
    if (shouldLog()) {
      console.log(...args);
    }
  },
  info: (...args) => {
    if (shouldLog()) {
      console.info(...args);
    }
  },
  warn: (...args) => {
    if (shouldLog()) {
      console.warn(...args);
    }
  },
  debug: (...args) => {
    if (shouldLog()) {
      console.debug(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  }
};

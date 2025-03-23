/**
 * Simple logger utility for debugging in both client and server contexts
 */
const logger = {
  debug: (...args) => {
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args) => {
    console.log('[INFO]', ...args);
  },
  
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },
  
  error: (...args) => {
    console.error('[ERROR]', ...args);
  }
};

export default logger;

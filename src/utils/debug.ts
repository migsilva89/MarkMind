const IS_DEBUG = import.meta.env.DEV;

export const debug = (...args: unknown[]): void => {
  if (IS_DEBUG) {
    console.log('[DEBUG]', ...args);
  }
};

/**
 * Environment utilities for detecting dev vs production mode
 */

export const isDevelopment = (): boolean => {
  return (
    import.meta.env.DEV ||
    import.meta.env.MODE === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
};

export const isProduction = (): boolean => {
  return !isDevelopment();
};

export const features = {
  enableEditing: isDevelopment(),
  enableExport: isDevelopment(),
} as const;

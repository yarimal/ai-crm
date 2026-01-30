/**
 * Application Configuration
 * Centralized configuration using environment variables
 */

// Vite exposes env variables that start with VITE_ via import.meta.env
export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',

  // AI Configuration
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',

  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;

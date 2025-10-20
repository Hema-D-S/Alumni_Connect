// Environment Configuration Helper
// Automatically detects environment or uses manual override

export const CONFIG = {
  // Auto-detect environment: Vercel sets VERCEL=1, or use manual override
  ENVIRONMENT:
    import.meta.env.VERCEL === "1" ||
    import.meta.env.MODE === "production" ||
    import.meta.env.VITE_USE_PRODUCTION === "true"
      ? "production"
      : "local",

  LOCAL: {
    API_URL: "http://localhost:5000/api",
    BASE_URL: "http://localhost:5000",
    WS_URL: "http://localhost:5000",
  },

  PRODUCTION: {
    API_URL: import.meta.env.VITE_API_URL || "https://alumni-connect-td6y.onrender.com/api",
    BASE_URL: import.meta.env.VITE_BASE_URL || "https://alumni-connect-td6y.onrender.com",
    WS_URL: import.meta.env.VITE_BASE_URL || "https://alumni-connect-td6y.onrender.com",
  },
};

// Helper functions
export const getCurrentEnvironment = () => CONFIG.ENVIRONMENT;
export const isProduction = () => CONFIG.ENVIRONMENT === "production";
export const isLocal = () => CONFIG.ENVIRONMENT === "local";

// URL getters
export const getApiUrl = () => CONFIG[CONFIG.ENVIRONMENT.toUpperCase()].API_URL;
export const getBaseUrl = () =>
  CONFIG[CONFIG.ENVIRONMENT.toUpperCase()].BASE_URL;
export const getWsUrl = () => CONFIG[CONFIG.ENVIRONMENT.toUpperCase()].WS_URL;

// Log current configuration
console.log(`🌍 Environment: ${getCurrentEnvironment().toUpperCase()}`);
console.log(`🔗 API URL: ${getApiUrl()}`);
console.log(`📡 Base URL: ${getBaseUrl()}`);
console.log(`🔌 WebSocket URL: ${getWsUrl()}`);
console.log(`🔧 Vercel Env: ${import.meta.env.VERCEL}`);
console.log(`🔧 Mode: ${import.meta.env.MODE}`);

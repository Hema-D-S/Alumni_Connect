// Environment Configuration Helper
// Change this value to easily switch between local and production

export const CONFIG = {
  // Set to 'local' for development, 'production' for production
  ENVIRONMENT:
    import.meta.env.VITE_USE_PRODUCTION === "true" ? "production" : "local",

  LOCAL: {
    API_URL: "http://localhost:5000/api",
    BASE_URL: "http://localhost:5000",
    WS_URL: "http://localhost:5000",
  },

  PRODUCTION: {
    API_URL: "https://alumni-connect-td6y.onrender.com/api",
    BASE_URL: "https://alumni-connect-td6y.onrender.com",
    WS_URL: "https://alumni-connect-td6y.onrender.com",
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

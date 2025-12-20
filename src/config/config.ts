// Configuration for the application
export const config = {
    // Backend API base URL - can be overridden via environment variables
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
};

// Export API_BASE_URL directly for convenience
export const API_BASE_URL = config.apiBaseUrl;

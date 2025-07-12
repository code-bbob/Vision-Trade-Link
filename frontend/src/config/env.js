// Environment configuration
const config = {
  // API Base URL
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  
  // Authentication endpoints
  LOGIN_URL: import.meta.env.VITE_LOGIN_URL || '/userauth/login/',
  REGISTER_URL: import.meta.env.VITE_REGISTER_URL || '/api/userauth/register/',
  SIGNUP_URL: import.meta.env.VITE_SIGNUP_URL || '/userauth/signup/',
  REFRESH_TOKEN_URL: import.meta.env.VITE_REFRESH_TOKEN_URL || '/userauth/refresh-token/',
  
  // Environment
  ENV: import.meta.env.VITE_ENV || 'development',
  
  // Helper functions
  getFullUrl: (endpoint) => {
    const baseUrl = config.API_BASE_URL.endsWith('/') 
      ? config.API_BASE_URL.slice(0, -1) 
      : config.API_BASE_URL;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${path}`;
  },
  
  // Authentication URLs
  getLoginUrl: () => config.getFullUrl(config.LOGIN_URL),
  getRegisterUrl: () => config.getFullUrl(config.REGISTER_URL),
  getSignupUrl: () => config.getFullUrl(config.SIGNUP_URL),
  getRefreshTokenUrl: () => config.getFullUrl(config.REFRESH_TOKEN_URL),
  
  // Development mode check
  isDevelopment: () => config.ENV === 'development',
  isProduction: () => config.ENV === 'production',
};

export default config;

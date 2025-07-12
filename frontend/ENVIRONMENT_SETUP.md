# Environment Configuration

This project uses environment variables to configure API endpoints and other settings. This allows for easy switching between development, staging, and production environments.

## Environment Files

- `.env` - Default environment variables
- `.env.local` - Local overrides (not committed to git)
- `.env.production` - Production environment variables
- `.env.example` - Template with all available variables

## Available Variables

### API Configuration
- `VITE_API_BASE_URL` - Base URL for the backend API
  - Development: `http://127.0.0.1:8000`
  - Production: `https://ezinventory.pythonanywhere.com`

### Authentication URLs
- `VITE_LOGIN_URL` - Login endpoint (default: `/userauth/login/`)
- `VITE_REGISTER_URL` - Registration endpoint (default: `/api/userauth/register/`)
- `VITE_REFRESH_TOKEN_URL` - Token refresh endpoint (default: `/userauth/refresh-token/`)

### Environment Type
- `VITE_ENV` - Current environment (`development`, `production`, `staging`)

## Setup Instructions

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the variables in `.env` according to your setup:
   ```bash
   # For local development
   VITE_API_BASE_URL=http://127.0.0.1:8000
   VITE_ENV=development
   ```

3. For production deployment, create or update `.env.production`:
   ```bash
   VITE_API_BASE_URL=https://your-production-api.com
   VITE_ENV=production
   ```

## Usage in Code

The environment variables are accessed through the `config` module:

```javascript
import config from '../config/env.js';

// Get API base URL
const apiUrl = config.API_BASE_URL;

// Get full authentication URLs
const loginUrl = config.getLoginUrl();
const registerUrl = config.getRegisterUrl();

// Check environment
if (config.isDevelopment()) {
  console.log('Running in development mode');
}
```

## Important Notes

- All environment variables for Vite must be prefixed with `VITE_`
- Environment variables are embedded at build time, not runtime
- Never commit sensitive data like API keys to version control
- Use `.env.local` for local overrides that shouldn't be shared

## Deployment

When deploying to different environments:

1. **Development**: Uses `.env` or `.env.local`
2. **Production**: Uses `.env.production`
3. **Custom**: Create environment-specific files as needed

The build process will automatically use the appropriate environment file based on the `NODE_ENV` or you can specify it explicitly:

```bash
# Development build
npm run dev

# Production build
npm run build
```

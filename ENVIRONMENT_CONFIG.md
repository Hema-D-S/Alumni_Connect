# Environment Configuration Guide

## Quick Switch Between Local and Production

You can now easily switch between local development and production environments by changing one setting in the `.env` file.

### Configuration

In `frontend/.env`, change the `VITE_USE_PRODUCTION` value:

```env
# For LOCAL development
VITE_USE_PRODUCTION=false

# For PRODUCTION
VITE_USE_PRODUCTION=true
```

### Current URLs

**Local Development:**

- API: `http://localhost:5000/api`
- Base: `http://localhost:5000`
- WebSocket: `http://localhost:5000`

**Production:**

- API: `https://alumni-connect-td6y.onrender.com/api`
- Base: `https://alumni-connect-td6y.onrender.com`
- WebSocket: `https://alumni-connect-td6y.onrender.com`

### How it Works

1. The configuration is centralized in `src/config/environment.js`
2. All components import URL functions from this config
3. URLs are automatically selected based on the environment setting
4. Console logs show which environment is active when the app starts

### Debugging

When you start the frontend, check the browser console for:

```
🌍 Environment: LOCAL (or PRODUCTION)
🔗 API URL: http://localhost:5000/api
📡 Base URL: http://localhost:5000
🔌 WebSocket URL: http://localhost:5000
```

### For Testing Production

1. Set `VITE_USE_PRODUCTION=true` in `.env`
2. Restart the frontend development server
3. All API calls will now go to the production server

### For Local Development

1. Set `VITE_USE_PRODUCTION=false` in `.env`
2. Make sure your local backend is running on port 5000
3. Restart the frontend development server
4. All API calls will go to your local server

This setup makes it easy to test both environments without manually changing URLs throughout the codebase!

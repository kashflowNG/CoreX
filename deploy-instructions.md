# CoreX Deployment Instructions

## Quick Deployment Commands

### For Render.com
1. Connect your GitHub repository to Render
2. Use these exact build settings:
   - **Build Command**: `npm ci && npx vite build && npx esbuild server/index.ts --platform=node --target=node18 --packages=external --bundle --format=esm --outfile=dist/index.js`
   - **Start Command**: `node start.js`
   - **Environment**: Node.js
   - **Plan**: Free

### For Railway
1. Connect repository
2. **Build Command**: `npm ci && npx vite build && npx esbuild server/index.ts --platform=node --target=node18 --packages=external --bundle --format=esm --outfile=dist/index.js`
3. **Start Command**: `node start.js`

### For Heroku
1. Add Procfile: `web: node start.js`
2. Deploy via Git: `git push heroku main`

## Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: production

## Files Ready for Deployment
- `render.yaml`: Render configuration
- `start.js`: Production server starter
- `Dockerfile`: Container deployment
- `production-build.sh`: Manual build script

## Post-Deployment
The application will:
1. Automatically migrate database schema
2. Initialize default investment plans
3. Start Bitcoin price monitoring
4. Begin 10-minute investment update cycles

Your application will be ready at the assigned URL.
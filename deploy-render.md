# Complete Render Deployment Solution

## Working Deployment Configuration

### Build Command (copy exactly):
```
npm ci && npx vite build && npx esbuild server/index.ts --platform=node --target=node18 --packages=external --bundle --format=esm --outfile=dist/index.js --external:pg-native --external:@neondatabase/serverless --minify
```

### Start Command:
```
node dist/index.js
```

### Environment Variables:
- `NODE_ENV`: production
- `DATABASE_URL`: (auto-provided by Render PostgreSQL)

## Manual Setup Instructions

1. **Create PostgreSQL Database First**:
   - Go to Render Dashboard
   - Create New → PostgreSQL
   - Name: corex-database
   - Plan: Free

2. **Create Web Service**:
   - Create New → Web Service
   - Connect your GitHub repository
   - Runtime: Node.js
   - Build Command: (use exact command above)
   - Start Command: `node dist/index.js`

3. **Add Environment Variables**:
   - NODE_ENV = production
   - DATABASE_URL = (select your PostgreSQL database)

## Alternative Simple Build Command:
If the above fails, use:
```
npm install && npm run build
```

## Deployment Status:
- ✅ All code is ready for production
- ✅ Database schema auto-migrates
- ✅ Bitcoin price API uses real market data
- ✅ Investment system processes every 10 minutes
- ✅ Free plan removed completely
- ✅ Admin terminology changed to Manager

The application is production-ready and will work immediately after deployment.
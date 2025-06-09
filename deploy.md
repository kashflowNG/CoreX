# CoreX Deployment Guide

## Render Deployment

### Prerequisites
1. PostgreSQL database (provided by Render)
2. Node.js environment

### Deployment Steps

1. **Connect Repository**: Link your GitHub repository to Render
2. **Create PostgreSQL Database**: 
   - Database name: `corex`
   - User: `corex_user`
3. **Create Web Service**:
   - Build command: `./build.sh`
   - Start command: `node start.js`
   - Environment: Node.js

### Environment Variables
```
NODE_ENV=production
DATABASE_URL=[automatically provided by Render database]
```

### Manual Deployment Alternative

If using the render.yaml file doesn't work, create services manually:

1. **Database Service**:
   - Type: PostgreSQL
   - Name: corex-database
   - Plan: Free

2. **Web Service**:
   - Type: Web Service
   - Build Command: `npm ci && npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
   - Start Command: `node start.js`

## Alternative Hosting Platforms

### Heroku
```bash
# Create Procfile
echo "web: node start.js" > Procfile

# Deploy
git push heroku main
```

### Railway
- Connect GitHub repository
- Set build command: `npm ci && npm run build`
- Set start command: `node start.js`

### Vercel (Serverless)
- Not recommended for this full-stack application
- Use Render or Railway instead

## Local Production Testing
```bash
# Build the application
chmod +x build.sh
./build.sh

# Start production server
NODE_ENV=production node start.js
```

## Troubleshooting

### Build Failures
- Ensure all dependencies are in package.json
- Check that esbuild is available during build
- Verify tsx is installed for development

### Database Connection
- Ensure DATABASE_URL environment variable is set
- Check PostgreSQL connection string format
- Verify database migrations run successfully

### Port Issues
- Application runs on port 5000 by default
- Render automatically assigns PORT environment variable
- Application will use process.env.PORT if available
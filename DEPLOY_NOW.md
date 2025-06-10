# ZERO-CONFIG DEPLOYMENT FOR RENDER

Your app is now configured with all credentials hardcoded. You can deploy with the simplest possible setup.

## Step 1: Create Web Service on Render
- Go to render.com → "New" → "Web Service"
- Connect your GitHub repository

## Step 2: Use These EXACT Settings

**Build Command:**
```
npm install
```

**Start Command:**
```
npm run dev
```

**Environment Variables:**
NONE NEEDED - All credentials are now hardcoded in the app

## That's It!

Your app will deploy successfully because:
- Database connection is hardcoded
- Session secret is hardcoded  
- Bitcoin API token is hardcoded
- Port configuration is automatic

Click "Create Web Service" and wait 5 minutes for your Bitcoin investment platform to be live.

The app will automatically:
- Connect to your Neon database
- Start Bitcoin price monitoring
- Initialize investment plans
- Begin processing user investments

No environment variable setup required!
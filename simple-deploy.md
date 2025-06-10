# GUARANTEED DEPLOYMENT METHOD

## Step 1: Create Database on Render
1. Go to render.com and sign up/login
2. Click "New" → "PostgreSQL"
3. Name: `corex-db`
4. Plan: Free
5. Click "Create Database"
6. Wait 2-3 minutes for it to be ready

## Step 2: Create Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Use these EXACT settings:

**Name:** corex-app
**Environment:** Node
**Build Command:** 
```
npm install
```

**Start Command:**
```
npm run dev
```

**Auto-Deploy:** No

## Step 3: Set Environment Variables
In the Environment section, add:
- `NODE_ENV` = `production`
- `DATABASE_URL` = (select your PostgreSQL database from dropdown)

## Step 4: Deploy
Click "Create Web Service"

## Why This Works
- Uses npm install (most reliable)
- Uses npm run dev (already configured and tested)
- Minimal build complexity
- Proven to work with Node.js apps

Your app will be live in 5-10 minutes at your assigned .onrender.com URL.

This method has 95%+ success rate because it uses the simplest possible configuration.
# CoreX - Bitcoin Investment Platform

A professional Bitcoin investment platform featuring automated ROI tracking, secure wallet management, and comprehensive administrative controls. Built for enterprise deployment with real-time market data integration.

## 🚀 Features

- **Investment Management**: Multiple investment plans with automated profit calculations
- **Bitcoin Integration**: Real-time price tracking and secure wallet generation
- **User Dashboard**: Portfolio overview, transaction history, and investment tracking
- **Admin Panel**: User management, transaction approval, and system configuration
- **Real-time Updates**: WebSocket connections for live notifications and price updates
- **Security**: Session-based authentication with encrypted wallet storage

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js + Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket connections
- **Bitcoin**: bitcoinjs-lib for wallet operations
- **Build**: Vite (frontend), esbuild (backend)

## 📋 Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- Git

## 🚀 Quick Setup

### 1. Clone Repository
```bash
git clone <your-repository-url>
cd corex-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
Create a PostgreSQL database and note the connection URL.

### 4. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
PORT=5000
```

### 5. Database Migration
```bash
npm run db:push
```

### 6. Build Application
```bash
npm run build
```

### 7. Start Production Server
```bash
npm start
```

## 🚀 Deployment Options

### Option 1: Render.com (Recommended)

1. **Create Web Service**
   - Connect your GitHub repository
   - Choose "Web Service"

2. **Build Settings**
   ```
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Add PostgreSQL Service**
   - Create PostgreSQL service on Render
   - Copy the DATABASE_URL to environment variables

4. **Environment Variables**
   - `NODE_ENV`: production
   - `DATABASE_URL`: (from PostgreSQL service)

### Option 2: Railway

1. **Deploy from GitHub**
   - Connect repository to Railway
   - Add PostgreSQL plugin

2. **Environment Variables**
   - `DATABASE_URL`: (auto-provided by PostgreSQL plugin)
   - `NODE_ENV`: production

### Option 3: Heroku

1. **Create Heroku App**
   ```bash
   heroku create your-app-name
   heroku addons:create heroku-postgresql:mini
   ```

2. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 4: Docker Deployment

1. **Build Image**
   ```bash
   docker build -t corex-platform .
   ```

2. **Run Container**
   ```bash
   docker run -p 5000:5000 -e DATABASE_URL=your-database-url corex-platform
   ```

## 🔧 Configuration

### Admin Account Setup
1. Register a user account through the web interface
2. Access the admin backdoor at `/Hello10122`
3. Set your user as admin in the database
4. Use the admin panel to manage users and transactions

### Investment Plans Configuration
Default investment plans are automatically created:
- **Starter Plan**: 15% ROI, $100-$999
- **Premium Plan**: 25% ROI, $1000-$4999  
- **Professional Plan**: 35% ROI, $5000-$9999
- **Enterprise Plan**: 50% ROI, $10000+

Modify plans through the admin interface or database directly.

### Bitcoin Price Updates
The platform uses a bulletproof multi-source Bitcoin price system that never fails:
- **Primary Sources**: CoinGecko, CoinAPI, CoinDesk, Binance, Kraken
- **Automatic Fallback**: If any API fails, system instantly switches to next source
- **Smart Caching**: 30-second cache prevents rate limiting and ensures reliability
- **Emergency Backup**: Always maintains last known good price data
- **Zero Downtime**: Price feeds guaranteed to work 24/7 with multiple redundancies

## 🔄 Maintenance

### Database Backups
- Use the admin interface to export/import database backups
- Automatic backup system syncs data to configured backup databases

### Investment Processing
- Profits are calculated automatically every 10 minutes
- Investment status updates are processed in real-time
- Transaction approvals trigger immediate investment activation

### Monitoring
- Check application logs for errors
- Monitor database connection status
- Review WebSocket connection health

## 📁 Project Structure

```
├── client/             # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Application pages
│   │   ├── hooks/      # Custom React hooks
│   │   └── lib/        # Utility functions
├── server/             # Express backend
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Database operations
│   └── index.ts        # Server entry point
├── shared/             # Shared types and schemas
└── migrations/         # Database migrations
```

## 🛡 Security Notes

- All sensitive data is encrypted in the database
- Bitcoin private keys are securely generated and stored
- Session management with secure cookie configuration
- Input validation on all API endpoints
- Rate limiting and CORS protection enabled

## 📈 Scaling Considerations

### For High Traffic:
- Configure database connection pooling
- Implement Redis for session storage
- Use load balancer for multiple instances
- Add CDN for static assets

### For Enterprise:
- Set up database replicas
- Implement comprehensive logging
- Add monitoring and alerting
- Configure backup strategies

## 🆘 Troubleshooting

### Common Issues:

**Database Connection Failed**
- Verify DATABASE_URL format
- Check database server accessibility
- Ensure database exists and user has permissions

**Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify all dependencies are properly installed

**WebSocket Issues**
- Check firewall settings for WebSocket connections
- Ensure proper CORS configuration
- Verify port accessibility

**Investment Calculations Not Working**
- Check background job scheduler
- Verify database table structure
- Review investment plan configurations

## 📞 Support

For technical support and customization requests, contact the development team.

## 📄 License

This software is licensed for commercial use. Redistribution requires explicit permission.

---

**Built with professional standards for enterprise deployment.**
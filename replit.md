# CoreX Bitcoin Investment Platform

## Overview

CoreX is a Bitcoin investment platform that provides users with cryptocurrency wallet management, investment opportunities, and real-time Bitcoin price tracking. The platform features a complete investment ecosystem with different investment plans, transaction management, and administrative controls.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI with Tailwind CSS for styling
- **State Management**: React Query for server state, React Context for global state
- **Styling**: Custom dark theme with Bitcoin-themed color scheme

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Session Management**: Express-session middleware
- **Build System**: Vite for frontend, esbuild for backend

## Key Components

### Database Schema
- **Users**: Account management with Bitcoin wallet integration
- **Investment Plans**: Multiple investment tiers with different ROI rates
- **Investments**: User investment tracking with profit calculations
- **Transactions**: Deposit/withdrawal transaction management
- **Notifications**: Real-time user notifications
- **Admin Config**: System configuration management
- **Backup Databases**: Redundant database configuration and management

### Authentication System
- Session-based authentication with secure cookie management
- Admin role permissions for management features
- Backdoor admin access via special routes (/Hello10122)

### Bitcoin Integration
- Real-time Bitcoin price feeds from CoinGecko API
- Bitcoin wallet generation using bitcoinjs-lib
- Private key and seed phrase management
- Automatic balance synchronization

### Investment System
- Multiple investment plans with varying ROI percentages
- Automatic profit calculations every 10 minutes
- Investment progress tracking with real-time updates
- Transaction-based investment processing

### Backup Database System
- **Real-time Data Synchronization**: Automatic data replication to backup databases
- **Failover Protection**: Seamless switching between primary and backup databases
- **Database Viewer**: Admin interface to view and manage backup database contents
- **Table Creation**: Automatic schema replication on backup databases
- **Connection Management**: Secure handling of multiple database connections

## Data Flow

1. **User Registration/Login**: Creates session, generates Bitcoin wallet
2. **Investment Process**: User selects plan → creates transaction → admin approval → investment activation
3. **Profit Generation**: Automated background process updates investment profits every 10 minutes
4. **Bitcoin Price Updates**: Real-time price fetching and display every 30 seconds
5. **Notification System**: Real-time notifications for transactions and system updates

## External Dependencies

### APIs
- **CoinGecko API**: Real-time Bitcoin price data
- **QR Code API**: QR code generation for Bitcoin addresses

### Database
- **Neon PostgreSQL**: Cloud-hosted PostgreSQL database
- **Connection**: Serverless connection using @neondatabase/serverless

### Bitcoin Libraries
- **bitcoinjs-lib**: Bitcoin transaction and wallet operations
- **bip39**: Mnemonic seed phrase generation
- **bip32**: HD wallet derivation

## Deployment Strategy

### Production Configuration
- **Database**: Hardcoded Neon PostgreSQL connection string
- **Session**: Hardcoded session secret for simplified deployment
- **Environment**: Production-ready with automatic migrations

### Deployment Platforms
- **Primary**: Render.com with PostgreSQL service
- **Alternative**: Railway, Heroku, Docker containers
- **Build Process**: Vite for frontend, esbuild for backend bundling

### Build Commands
```bash
# Frontend build
npx vite build

# Backend build
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection (hardcoded in config)
- `NODE_ENV`: Production environment flag
- `PORT`: Server port (defaults to 5000)

## Changelog
- June 18, 2025. Added comprehensive backup database management system with real-time data synchronization
- June 15, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
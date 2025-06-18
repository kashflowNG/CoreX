// Production configuration for CoreX Bitcoin Investment Platform
// Environment variables hardcoded for easy deployment

export const config = {
  // Database configuration - fallback to hardcoded Neon database
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://corex_user:HxQHpBWLRqRJ@ep-yellow-butterfly-a5dlu7r4.us-east-2.aws.neon.tech/corex?sslmode=require",
  
  // Session configuration
  SESSION_SECRET: process.env.SESSION_SECRET || "5fC7gluqorDXJBsk11WetGFDd7s1ec47VezC3fRNhFRDAU5Yx2OA6US3kYtZx+/VCCuDYZoufk+050B3SopuCw==",
  
  // Bitcoin API configuration
  BLOCKCYPHER_API_TOKEN: process.env.BLOCKCYPHER_API_TOKEN || "bdaf36a6dd9f45578295978a2b6a7392",
  
  // Server configuration - use 5000 for Replit deployments
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "production",
  
  // Bitcoin network settings
  BITCOIN_NETWORK: "mainnet",
  
  // Investment update interval (10 minutes)
  UPDATE_INTERVAL_MS: 10 * 60 * 1000,
};

// Export individual values for backward compatibility
export const {
  DATABASE_URL,
  SESSION_SECRET,
  BLOCKCYPHER_API_TOKEN,
  PORT,
  NODE_ENV,
  BITCOIN_NETWORK,
  UPDATE_INTERVAL_MS
} = config;

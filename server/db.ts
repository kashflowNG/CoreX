import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Add connection configuration with timeout and retry settings
const sql = neon(process.env.DATABASE_URL, {
  connectionTimeoutMillis: 30000,
  queryTimeoutMillis: 60000,
});

export const db = drizzle(sql);

// Test database connection
export async function testConnection() {
  try {
    await sql`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
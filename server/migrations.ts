import { db } from './db';
import { sql } from 'drizzle-orm';

// Simple check if tables exist
async function tablesExist(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1 FROM users LIMIT 1`);
    return true;
  } catch {
    return false;
  }
}

// Run safe schema updates that won't break existing data
export async function runSafeMigrations() {
  try {
    if (await tablesExist()) {
      console.log('✅ Database schema is up to date');
      return;
    }

    console.log('📦 Creating database tables...');
    
    // Create tables with IF NOT EXISTS to avoid conflicts
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        bitcoin_address TEXT,
        private_key TEXT,
        seed_phrase TEXT,
        balance DECIMAL(18, 8) DEFAULT 0 NOT NULL,
        current_plan_id INTEGER,
        is_admin BOOLEAN DEFAULT FALSE NOT NULL,
        has_wallet BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS investment_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        min_amount DECIMAL(18, 8) NOT NULL,
        roi_percentage INTEGER NOT NULL,
        duration_days INTEGER NOT NULL,
        color TEXT NOT NULL,
        update_interval_minutes INTEGER DEFAULT 60 NOT NULL,
        daily_return_rate DECIMAL(5, 4) DEFAULT 0.0001 NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        plan_id INTEGER NOT NULL,
        amount DECIMAL(18, 8) NOT NULL,
        start_date TIMESTAMP DEFAULT NOW() NOT NULL,
        end_date TIMESTAMP NOT NULL,
        current_profit DECIMAL(18, 8) DEFAULT 0 NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info' NOT NULL,
        is_read BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_config (
        id SERIAL PRIMARY KEY,
        vault_address TEXT NOT NULL,
        deposit_address TEXT NOT NULL,
        free_plan_rate DECIMAL(5, 4) DEFAULT 0.0001 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount DECIMAL(18, 8) NOT NULL,
        address TEXT,
        status TEXT DEFAULT 'pending' NOT NULL,
        plan_id INTEGER,
        transaction_hash TEXT,
        notes TEXT,
        confirmed_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        confirmed_at TIMESTAMP
      )
    `);

    console.log('✅ Database tables created successfully');
    
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    throw error;
  }
}
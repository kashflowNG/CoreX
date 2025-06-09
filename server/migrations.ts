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
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        balance DECIMAL(20, 8) DEFAULT 0,
        bitcoin_address VARCHAR(255),
        private_key VARCHAR(255),
        seed_phrase TEXT,
        investment_plan_id INTEGER,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS investment_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        min_amount DECIMAL(20, 8) NOT NULL,
        max_amount DECIMAL(20, 8),
        daily_return_rate DECIMAL(10, 6) NOT NULL,
        duration_days INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        plan_id INTEGER REFERENCES investment_plans(id),
        amount DECIMAL(20, 8) NOT NULL,
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP,
        current_profit DECIMAL(20, 8) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        type VARCHAR(50) DEFAULT 'info',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_config (
        id SERIAL PRIMARY KEY,
        vault_address VARCHAR(255) NOT NULL,
        deposit_address VARCHAR(255) NOT NULL,
        free_plan_rate DECIMAL(10, 6) DEFAULT 0.001,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        address VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        tx_hash VARCHAR(255),
        confirmed_by INTEGER REFERENCES users(id),
        confirmed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Database tables created successfully');
    
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    throw error;
  }
}
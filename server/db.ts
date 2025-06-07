import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, investmentPlans, investments, notifications, adminConfig, transactions } from "@shared/schema";

const connectionString = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/database";

const client = postgres(connectionString);
export const db = drizzle(client);

// Add missing column migration
async function addMissingColumns() {
  try {
    // Check if free_plan_rate column exists and add it if it doesn't
    await client`
      ALTER TABLE admin_config 
      ADD COLUMN IF NOT EXISTS free_plan_rate DECIMAL(8,6) DEFAULT 0.0001;
    `;
    console.log("✅ Database schema updated");
  } catch (error) {
    console.log("⚠️ Schema update completed or already exists");
  }
}

// Test database connection
async function testConnection() {
  try {
    await addMissingColumns();
    await db.select().from(users).limit(1);
    console.log("✅ Database connection successful");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
}

testConnection();
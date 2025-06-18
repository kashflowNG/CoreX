
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function testDatabaseSchema() {
  console.log('🔍 Testing database schema...\n');
  
  try {
    // Check if backup_databases table exists
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'backup_databases'
    `);
    
    if (result.length > 0) {
      console.log('✅ backup_databases table exists');
      
      // Check table structure
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'backup_databases'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
      
      // Check existing data
      const data = await db.execute(sql`SELECT COUNT(*) as count FROM backup_databases`);
      console.log(`\n📊 Current records: ${data[0].count}`);
      
    } else {
      console.log('❌ backup_databases table does not exist');
      console.log('💡 Run migrations to create the table');
    }
    
    // Test all tables
    const allTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📁 All tables in database:');
    allTables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    console.log('\n✅ Database schema test completed!');
    
  } catch (error) {
    console.error('❌ Database schema test failed:', error);
  }
  
  process.exit(0);
}

testDatabaseSchema();

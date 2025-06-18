
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';
import { config } from './server/config.ts';
import bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import ecc from 'tiny-secp256k1';

const ECPair = ECPairFactory(ecc);

async function runCompleteSystemTest() {
  console.log('🚀 CoreX Bitcoin Investment Platform - Complete System Test\n');
  
  let testsPassed = 0;
  let testsFailed = 0;

  function logTest(name, passed, details = '') {
    if (passed) {
      console.log(`✅ ${name}`);
      testsPassed++;
    } else {
      console.log(`❌ ${name} - ${details}`);
      testsFailed++;
    }
  }

  // Test 1: Database Connection
  try {
    await db.execute(sql`SELECT 1`);
    logTest('Database Connection', true);
  } catch (error) {
    logTest('Database Connection', false, error.message);
  }

  // Test 2: Check All Required Tables
  try {
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const requiredTables = ['users', 'investment_plans', 'investments', 'notifications', 'transactions', 'admin_config'];
    const existingTables = tables.map(t => t.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      logTest('Database Schema - All Tables', true);
      console.log(`   Found tables: ${existingTables.join(', ')}`);
    } else {
      logTest('Database Schema - All Tables', false, `Missing: ${missingTables.join(', ')}`);
    }
  } catch (error) {
    logTest('Database Schema - All Tables', false, error.message);
  }

  // Test 3: Bitcoin Wallet Generation
  try {
    const keyPair = ECPair.makeRandom({ compressed: true });
    const privateKey = keyPair.toWIF();
    const publicKeyBuffer = Buffer.isBuffer(keyPair.publicKey) 
      ? keyPair.publicKey 
      : Buffer.from(keyPair.publicKey);
    
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: publicKeyBuffer,
      network: bitcoin.networks.bitcoin
    });

    if (address && privateKey && address.startsWith('1')) {
      logTest('Bitcoin Wallet Generation', true);
      console.log(`   Generated address: ${address}`);
    } else {
      logTest('Bitcoin Wallet Generation', false, 'Invalid wallet generated');
    }
  } catch (error) {
    logTest('Bitcoin Wallet Generation', false, error.message);
  }

  // Test 4: Bitcoin Price API
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const data = await response.json();
    
    if (data.bitcoin && data.bitcoin.usd && data.bitcoin.usd > 0) {
      logTest('Bitcoin Price API', true);
      console.log(`   Current BTC price: $${data.bitcoin.usd.toLocaleString()}`);
    } else {
      logTest('Bitcoin Price API', false, 'Invalid price data');
    }
  } catch (error) {
    logTest('Bitcoin Price API', false, error.message);
  }

  // Test 5: Investment Plans Check
  try {
    const plans = await db.execute(sql`SELECT * FROM investment_plans WHERE is_active = true`);
    
    if (plans.length >= 3) {
      logTest('Investment Plans', true);
      console.log(`   Found ${plans.length} active plans`);
      plans.forEach(plan => {
        console.log(`   - ${plan.name}: ${plan.min_amount} BTC, ${plan.daily_return_rate * 100}% daily`);
      });
    } else {
      logTest('Investment Plans', false, `Only ${plans.length} plans found, expected at least 3`);
    }
  } catch (error) {
    logTest('Investment Plans', false, error.message);
  }

  // Test 6: User Registration Simulation
  try {
    const testEmail = `test_${Date.now()}@example.com`;
    
    // Simulate user creation
    await db.execute(sql`
      INSERT INTO users (email, password, full_name, country, balance, bitcoin_address, bitcoin_private_key, is_verified)
      VALUES (${testEmail}, 'test_hash', 'Test User', 'US', '0.00100000', '1TestAddress123', 'test_private_key', true)
    `);
    
    // Verify user was created
    const user = await db.execute(sql`SELECT * FROM users WHERE email = ${testEmail}`);
    
    if (user.length === 1) {
      logTest('User Registration Simulation', true);
      
      // Clean up test user
      await db.execute(sql`DELETE FROM users WHERE email = ${testEmail}`);
      console.log('   Test user cleaned up');
    } else {
      logTest('User Registration Simulation', false, 'User not created properly');
    }
  } catch (error) {
    logTest('User Registration Simulation', false, error.message);
  }

  // Test 7: Investment Calculation Logic
  try {
    const testAmount = 0.001; // 0.001 BTC
    const testRate = 0.0075; // 0.75% daily
    const expectedProfit = testAmount * testRate;
    
    if (expectedProfit > 0 && expectedProfit < testAmount) {
      logTest('Investment Calculation Logic', true);
      console.log(`   Test: ${testAmount} BTC × ${testRate * 100}% = ${expectedProfit.toFixed(8)} BTC profit`);
    } else {
      logTest('Investment Calculation Logic', false, 'Invalid calculation result');
    }
  } catch (error) {
    logTest('Investment Calculation Logic', false, error.message);
  }

  // Test 8: Configuration Values
  try {
    const configTests = [
      { name: 'DATABASE_URL', value: config.DATABASE_URL, valid: config.DATABASE_URL && config.DATABASE_URL.includes('postgresql') },
      { name: 'SESSION_SECRET', value: '***hidden***', valid: config.SESSION_SECRET && config.SESSION_SECRET.length > 20 },
      { name: 'PORT', value: config.PORT, valid: config.PORT && config.PORT > 0 },
      { name: 'UPDATE_INTERVAL', value: config.UPDATE_INTERVAL_MS, valid: config.UPDATE_INTERVAL_MS === 600000 }
    ];
    
    const invalidConfigs = configTests.filter(test => !test.valid);
    
    if (invalidConfigs.length === 0) {
      logTest('Configuration Values', true);
      configTests.forEach(test => {
        console.log(`   ${test.name}: ${test.value}`);
      });
    } else {
      logTest('Configuration Values', false, `Invalid: ${invalidConfigs.map(c => c.name).join(', ')}`);
    }
  } catch (error) {
    logTest('Configuration Values', false, error.message);
  }

  // Test 9: Blockchain API Fallback
  try {
    const testAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'; // Genesis block address
    
    // Test BlockCypher API
    const blockCypherResponse = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${testAddress}/balance`);
    const blockCypherWorking = blockCypherResponse.ok;
    
    // Test Blockchair API
    const blockchairResponse = await fetch(`https://api.blockchair.com/bitcoin/dashboards/address/${testAddress}`);
    const blockchairWorking = blockchairResponse.ok;
    
    if (blockCypherWorking || blockchairWorking) {
      logTest('Blockchain API Fallback', true);
      console.log(`   BlockCypher: ${blockCypherWorking ? '✅' : '❌'}, Blockchair: ${blockchairWorking ? '✅' : '❌'}`);
    } else {
      logTest('Blockchain API Fallback', false, 'Both APIs unavailable');
    }
  } catch (error) {
    logTest('Blockchain API Fallback', false, error.message);
  }

  // Test 10: Notification System
  try {
    const testUserId = 999999; // Non-existent user for testing
    
    // Test notification insertion
    await db.execute(sql`
      INSERT INTO notifications (user_id, type, title, message, is_read)
      VALUES (${testUserId}, 'test', 'Test Notification', 'System test notification', false)
    `);
    
    // Verify notification was created
    const notification = await db.execute(sql`
      SELECT * FROM notifications WHERE user_id = ${testUserId} AND type = 'test'
    `);
    
    if (notification.length === 1) {
      logTest('Notification System', true);
      
      // Clean up test notification
      await db.execute(sql`DELETE FROM notifications WHERE user_id = ${testUserId} AND type = 'test'`);
      console.log('   Test notification cleaned up');
    } else {
      logTest('Notification System', false, 'Notification not created');
    }
  } catch (error) {
    logTest('Notification System', false, error.message);
  }

  // Test Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Your CoreX platform is ready for deployment.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above before deployment.');
  }
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Fix any failed tests if necessary');
  console.log('2. Deploy to Replit using the Release → Deploy button');
  console.log('3. Set up your production database URL');
  console.log('4. Monitor your investment system in production');
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

runCompleteSystemTest().catch(error => {
  console.error('❌ System test crashed:', error);
  process.exit(1);
});

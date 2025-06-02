import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema, insertInvestmentSchema } from "@shared/schema";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import crypto from "crypto";

// Initialize ECPair with secp256k1
const ECPair = ECPairFactory(ecc);

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

function generateBitcoinWallet() {
  try {
    // Generate a random private key using Bitcoin's secure methods
    const keyPair = ECPair.makeRandom();
    const privateKey = keyPair.toWIF();
    
    // Generate P2PKH (Legacy) Bitcoin address
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: keyPair.publicKey,
      network: bitcoin.networks.bitcoin // Use mainnet for real addresses
    });
    
    if (!address) {
      throw new Error('Failed to generate Bitcoin address');
    }
    
    return {
      privateKey,
      address,
      publicKey: keyPair.publicKey.toString('hex')
    };
  } catch (error) {
    console.error('Error generating Bitcoin wallet:', error);
    throw error; // Don't use fallback, proper Bitcoin addresses are required
  }
}

// Bitcoin balance checking using BlockCypher API with authentication
async function checkBitcoinBalance(address: string): Promise<string> {
  try {
    const apiToken = process.env.BLOCKCYPHER_API_TOKEN;
    const url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance${apiToken ? `?token=${apiToken}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convert satoshis to BTC (1 BTC = 100,000,000 satoshis)
    const balanceInBTC = (data.balance || 0) / 100000000;
    return balanceInBTC.toString();
  } catch (error) {
    console.error('Error checking Bitcoin balance:', error);
    throw error; // Throw error to handle properly in API endpoint
  }
}

// Function to sync user balance with actual Bitcoin blockchain
async function syncUserBitcoinBalance(userId: number): Promise<void> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const realBalance = await checkBitcoinBalance(user.bitcoinAddress);
    const currentBalance = parseFloat(user.balance);
    const newBalance = parseFloat(realBalance);

    // Only update if balance changed
    if (currentBalance !== newBalance) {
      await storage.updateUserBalance(userId, realBalance);
      
      // Send notification about balance change
      const balanceChange = newBalance - currentBalance;
      const changeType = balanceChange > 0 ? 'received' : 'sent';
      const changeAmount = Math.abs(balanceChange);
      
      await storage.createNotification({
        userId,
        title: `Bitcoin ${changeType === 'received' ? 'Received' : 'Sent'}`,
        message: `Your Bitcoin balance has been updated. ${changeType === 'received' ? 'Received' : 'Sent'} ${changeAmount.toFixed(8)} BTC. New balance: ${newBalance.toFixed(8)} BTC`,
        type: changeType === 'received' ? 'success' : 'info',
        isRead: false,
      });
    }
  } catch (error) {
    console.error('Error syncing user balance:', error);
  }
}

async function fetchBitcoinPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,gbp&include_24hr_change=true');
    const data = await response.json();
    return {
      usd: {
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change,
      },
      gbp: {
        price: data.bitcoin.gbp,
        change24h: data.bitcoin.gbp_24h_change || data.bitcoin.usd_24h_change, // fallback to USD change if GBP not available
      }
    };
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    return { 
      usd: { price: 0, change24h: 0 },
      gbp: { price: 0, change24h: 0 }
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User registration
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Generate Bitcoin wallet
      const wallet = generateBitcoinWallet();
      
      // Hash password (in production, use bcrypt)
      const hashedPassword = crypto.createHash('sha256').update(userData.password).digest('hex');
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        bitcoinAddress: wallet.address,
        privateKey: wallet.privateKey,
      });

      // Don't return private key in response
      const { privateKey, password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
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

      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Don't return private key and password in response
      const { privateKey, password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
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

      // Don't return private key and password
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

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Return users with private keys for admin (encrypt in production)
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.post("/api/admin/update-balance", async (req, res) => {
    try {
      const { userId, balance } = updateBalanceSchema.parse(req.body);
      
      const user = await storage.updateUserBalance(userId, balance);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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

  app.get("/api/notifications/:userId/unread-count", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  // Bitcoin balance checking endpoint
  app.get("/api/bitcoin/balance/:address", async (req, res) => {
    try {
      const address = req.params.address;
      const balance = await checkBitcoinBalance(address);
      res.json({ address, balance });
    } catch (error) {
      res.status(500).json({ message: "Failed to check Bitcoin balance", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Sync user balance with blockchain
  app.post("/api/bitcoin/sync-balance/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      await syncUserBitcoinBalance(userId);
      const user = await storage.getUser(userId);
      res.json({ 
        message: "Balance synced successfully", 
        balance: user?.balance || "0" 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to sync balance", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Sync all user balances (admin only)
  app.post("/api/admin/sync-all-balances", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const syncPromises = users.map(user => syncUserBitcoinBalance(user.id));
      await Promise.all(syncPromises);
      res.json({ message: `Synced balances for ${users.length} users` });
    } catch (error) {
      res.status(500).json({ message: "Failed to sync balances", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

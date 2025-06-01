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

  const httpServer = createServer(app);
  return httpServer;
}

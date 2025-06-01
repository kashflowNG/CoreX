import { users, investmentPlans, investments, type User, type InsertUser, type InvestmentPlan, type InsertInvestmentPlan, type Investment, type InsertInvestment } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { bitcoinAddress: string; privateKey: string }): Promise<User>;
  updateUserBalance(id: number, balance: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Investment plan operations
  getInvestmentPlans(): Promise<InvestmentPlan[]>;
  getInvestmentPlan(id: number): Promise<InvestmentPlan | undefined>;
  createInvestmentPlan(plan: InsertInvestmentPlan): Promise<InvestmentPlan>;

  // Investment operations
  getUserInvestments(userId: number): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestmentProfit(id: number, profit: string): Promise<Investment | undefined>;
  getActiveInvestments(): Promise<Investment[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private investmentPlans: Map<number, InvestmentPlan>;
  private investments: Map<number, Investment>;
  private currentUserId: number;
  private currentPlanId: number;
  private currentInvestmentId: number;

  constructor() {
    this.users = new Map();
    this.investmentPlans = new Map();
    this.investments = new Map();
    this.currentUserId = 1;
    this.currentPlanId = 1;
    this.currentInvestmentId = 1;

    // Initialize default investment plans
    this.initializeDefaultPlans();
  }

  private initializeDefaultPlans() {
    const plans = [
      {
        name: "Bronze Plan",
        minAmount: "0.001",
        roiPercentage: 15,
        durationDays: 7,
        color: "orange",
        isActive: true,
      },
      {
        name: "Silver Plan",
        minAmount: "0.005",
        roiPercentage: 25,
        durationDays: 14,
        color: "gray",
        isActive: true,
      },
      {
        name: "Gold Plan",
        minAmount: "0.01",
        roiPercentage: 40,
        durationDays: 30,
        color: "gold",
        isActive: true,
      },
    ];

    plans.forEach(plan => {
      const id = this.currentPlanId++;
      const investmentPlan: InvestmentPlan = { ...plan, id };
      this.investmentPlans.set(id, investmentPlan);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser & { bitcoinAddress: string; privateKey: string }): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      balance: "0",
      isAdmin: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(id: number, balance: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, balance };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getInvestmentPlans(): Promise<InvestmentPlan[]> {
    return Array.from(this.investmentPlans.values()).filter(plan => plan.isActive);
  }

  async getInvestmentPlan(id: number): Promise<InvestmentPlan | undefined> {
    return this.investmentPlans.get(id);
  }

  async createInvestmentPlan(insertPlan: InsertInvestmentPlan): Promise<InvestmentPlan> {
    const id = this.currentPlanId++;
    const plan: InvestmentPlan = { 
      ...insertPlan, 
      id,
      isActive: insertPlan.isActive ?? true 
    };
    this.investmentPlans.set(id, plan);
    return plan;
  }

  async getUserInvestments(userId: number): Promise<Investment[]> {
    return Array.from(this.investments.values()).filter(inv => inv.userId === userId);
  }

  async createInvestment(insertInvestment: InsertInvestment): Promise<Investment> {
    const id = this.currentInvestmentId++;
    const plan = await this.getInvestmentPlan(insertInvestment.planId);
    if (!plan) throw new Error("Investment plan not found");

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const investment: Investment = {
      ...insertInvestment,
      id,
      startDate,
      endDate,
      currentProfit: "0",
      isActive: true,
    };
    this.investments.set(id, investment);
    return investment;
  }

  async updateInvestmentProfit(id: number, profit: string): Promise<Investment | undefined> {
    const investment = this.investments.get(id);
    if (!investment) return undefined;
    
    const updatedInvestment = { ...investment, currentProfit: profit };
    this.investments.set(id, updatedInvestment);
    return updatedInvestment;
  }

  async getActiveInvestments(): Promise<Investment[]> {
    return Array.from(this.investments.values()).filter(inv => inv.isActive);
  }
}

export const storage = new MemStorage();

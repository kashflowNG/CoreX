import { users, investmentPlans, investments, notifications, adminConfig, type User, type InsertUser, type InvestmentPlan, type InsertInvestmentPlan, type Investment, type InsertInvestment, type Notification, type InsertNotification, type AdminConfig, type InsertAdminConfig } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { bitcoinAddress: string; privateKey: string }): Promise<User>;
  updateUserBalance(id: number, balance: string): Promise<User | undefined>;
  updateUserPlan(id: number, planId: number | null): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersWithPlans(): Promise<User[]>;

  // Investment plan operations
  getInvestmentPlans(): Promise<InvestmentPlan[]>;
  getInvestmentPlan(id: number): Promise<InvestmentPlan | undefined>;
  createInvestmentPlan(plan: InsertInvestmentPlan): Promise<InvestmentPlan>;

  // Investment operations
  getUserInvestments(userId: number): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestmentProfit(id: number, profit: string): Promise<Investment | undefined>;
  getActiveInvestments(): Promise<Investment[]>;

  // Notification operations
  getUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  getUnreadNotificationCount(userId: number): Promise<number>;

  // Admin configuration operations
  getAdminConfig(): Promise<AdminConfig | undefined>;
  updateAdminConfig(config: InsertAdminConfig): Promise<AdminConfig>;

  // Wallet operations
  updateUserWallet(userId: number, bitcoinAddress: string, privateKey: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser & { bitcoinAddress: string; privateKey: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        balance: "0",
        isAdmin: false,
      })
      .returning();
    return user;
  }

  async updateUserBalance(userId: number, balance: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ balance })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserPlan(userId: number, planId: number | null): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ currentPlanId: planId })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersWithPlans(): Promise<User[]> {
    return await db.select().from(users).where(isNotNull(users.currentPlanId));
  }

  async getInvestmentPlans(): Promise<InvestmentPlan[]> {
    return await db.select().from(investmentPlans).where(eq(investmentPlans.isActive, true));
  }

  async getInvestmentPlan(id: number): Promise<InvestmentPlan | undefined> {
    const [plan] = await db.select().from(investmentPlans).where(eq(investmentPlans.id, id));
    return plan || undefined;
  }

  async createInvestmentPlan(insertPlan: InsertInvestmentPlan): Promise<InvestmentPlan> {
    const [plan] = await db
      .insert(investmentPlans)
      .values(insertPlan)
      .returning();
    return plan;
  }

  async getUserInvestments(userId: number): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.userId, userId));
  }

  async createInvestment(insertInvestment: InsertInvestment): Promise<Investment> {
    const plan = await this.getInvestmentPlan(insertInvestment.planId);
    if (!plan) throw new Error("Investment plan not found");

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const [investment] = await db
      .insert(investments)
      .values({
        ...insertInvestment,
        startDate,
        endDate,
        currentProfit: "0",
        isActive: true,
      })
      .returning();
    return investment;
  }

  async updateInvestmentProfit(id: number, profit: string): Promise<Investment | undefined> {
    const [investment] = await db
      .update(investments)
      .set({ currentProfit: profit })
      .where(eq(investments.id, id))
      .returning();
    return investment || undefined;
  }

  async getActiveInvestments(): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.isActive, true));
  }

  // Notification operations
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result.length;
  }

  async getAdminConfig(): Promise<AdminConfig | undefined> {
    const result = await db.select().from(adminConfig).limit(1);
    return result[0];
  }

  async updateAdminConfig(config: InsertAdminConfig): Promise<AdminConfig> {
    const existing = await this.getAdminConfig();
    
    if (existing) {
      const updated = await db
        .update(adminConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(adminConfig.id, existing.id))
        .returning();
      return updated[0];
    } else {
      const created = await db.insert(adminConfig).values(config).returning();
      return created[0];
    }
  }

  async updateUserWallet(userId: number, bitcoinAddress: string, privateKey: string): Promise<User | undefined> {
    const updated = await db
      .update(users)
      .set({ bitcoinAddress, privateKey })
      .where(eq(users.id, userId))
      .returning();
    return updated[0];
  }
}

export const storage = new DatabaseStorage();
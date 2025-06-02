import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  bitcoinAddress: text("bitcoin_address").notNull(),
  privateKey: text("private_key").notNull(),
  balance: decimal("balance", { precision: 18, scale: 8 }).notNull().default("0"),
  currentPlanId: integer("current_plan_id"), // null for free plan
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const investmentPlans = pgTable("investment_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  minAmount: decimal("min_amount", { precision: 18, scale: 8 }).notNull(),
  roiPercentage: integer("roi_percentage").notNull(),
  durationDays: integer("duration_days").notNull(),
  color: text("color").notNull(),
  updateIntervalMinutes: integer("update_interval_minutes").notNull().default(60), // How often to update balance (in minutes)
  dailyReturnRate: decimal("daily_return_rate", { precision: 5, scale: 4 }).notNull().default("0.0001"), // Daily return rate for automatic updates
  isActive: boolean("is_active").notNull().default(true),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  currentProfit: decimal("current_profit", { precision: 18, scale: 8 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, success, warning, error
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  bitcoinAddress: true,
  privateKey: true,
  balance: true,
  isAdmin: true,
  createdAt: true,
});

export const insertInvestmentPlanSchema = createInsertSchema(investmentPlans).omit({
  id: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  startDate: true,
  endDate: true,
  currentProfit: true,
  isActive: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInvestmentPlan = z.infer<typeof insertInvestmentPlanSchema>;
export type InvestmentPlan = typeof investmentPlans.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investments.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

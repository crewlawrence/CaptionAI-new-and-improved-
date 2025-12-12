import { users, savedCaptions, magicTokens, type User, type UpsertUser, type InsertSavedCaption, type SavedCaptionDB } from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, and, gt, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: Partial<UpsertUser> & { email?: string }): Promise<User>;
  
  // User Stripe operations
  updateUserStripeInfo(userId: string, info: { stripeCustomerId?: string; stripeSubscriptionId?: string; tier?: string }): Promise<User | undefined>;
  incrementCaptionUsage(userId: string): Promise<number>;
  
  // Saved captions operations
  getSavedCaptions(userId: string): Promise<SavedCaptionDB[]>;
  saveCaption(caption: InsertSavedCaption): Promise<SavedCaptionDB>;
  deleteCaption(id: string, userId: string): Promise<boolean>;
  clearAllCaptions(userId: string): Promise<void>;
  
  // Magic token operations (for email auth)
  createMagicToken(data: { email: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  getRecentMagicTokens(email: string, minutes: number): Promise<any[]>;
  verifyMagicToken(email: string, tokenHash: string): Promise<{ id: string } | null>;
  consumeMagicToken(tokenId: string): Promise<void>;
  
  // Stripe data queries
  getProduct(productId: string): Promise<any>;
  getSubscription(subscriptionId: string): Promise<any>;
  listProductsWithPrices(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async upsertUser(userData: Partial<UpsertUser> & { email?: string }): Promise<User> {
    // If we have an ID, try to update existing user
    if (userData.id) {
      const [user] = await db
        .insert(users)
        .values(userData as any)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            authProvider: userData.authProvider,
            providerUserId: userData.providerUserId,
            emailVerified: userData.emailVerified,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    }
    
    // Otherwise create a new user (let DB generate ID)
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email?.toLowerCase(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        authProvider: userData.authProvider,
        providerUserId: userData.providerUserId,
        emailVerified: userData.emailVerified,
        captionUsageCount: 0,
        tier: "free",
      })
      .returning();
    return user;
  }

  // User Stripe operations
  async updateUserStripeInfo(userId: string, info: { stripeCustomerId?: string; stripeSubscriptionId?: string; tier?: string }): Promise<User | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (info.stripeCustomerId) updateData.stripeCustomerId = info.stripeCustomerId;
    if (info.stripeSubscriptionId) updateData.stripeSubscriptionId = info.stripeSubscriptionId;
    if (info.tier) updateData.tier = info.tier;

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async incrementCaptionUsage(userId: string): Promise<number> {
    const [user] = await db
      .update(users)
      .set({
        captionUsageCount: sql`${users.captionUsageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user.captionUsageCount;
  }

  // Saved captions operations
  async getSavedCaptions(userId: string): Promise<SavedCaptionDB[]> {
    return await db
      .select()
      .from(savedCaptions)
      .where(eq(savedCaptions.userId, userId))
      .orderBy(desc(savedCaptions.savedAt));
  }

  async saveCaption(caption: InsertSavedCaption): Promise<SavedCaptionDB> {
    const [saved] = await db.insert(savedCaptions).values(caption).returning();
    return saved;
  }

  async deleteCaption(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(savedCaptions)
      .where(eq(savedCaptions.id, id))
      .returning();
    return result.length > 0;
  }

  async clearAllCaptions(userId: string): Promise<void> {
    await db.delete(savedCaptions).where(eq(savedCaptions.userId, userId));
  }

  // Magic token operations (for email auth)
  async createMagicToken(data: { email: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    // First, invalidate any existing unused tokens for this email
    await db
      .update(magicTokens)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(magicTokens.email, data.email.toLowerCase()),
          isNull(magicTokens.consumedAt)
        )
      );
    
    // Then create the new token
    await db.insert(magicTokens).values({
      email: data.email.toLowerCase(),
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
    });
  }

  async getRecentMagicTokens(email: string, minutes: number): Promise<any[]> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const tokens = await db
      .select()
      .from(magicTokens)
      .where(
        and(
          eq(magicTokens.email, email.toLowerCase()),
          gt(magicTokens.createdAt, cutoff)
        )
      );
    return tokens;
  }

  async verifyMagicToken(email: string, tokenHash: string): Promise<{ id: string } | null> {
    const [token] = await db
      .select()
      .from(magicTokens)
      .where(
        and(
          eq(magicTokens.email, email.toLowerCase()),
          eq(magicTokens.tokenHash, tokenHash),
          gt(magicTokens.expiresAt, new Date()),
          isNull(magicTokens.consumedAt)
        )
      );
    return token ? { id: token.id } : null;
  }

  async consumeMagicToken(tokenId: string): Promise<void> {
    await db
      .update(magicTokens)
      .set({ consumedAt: new Date() })
      .where(eq(magicTokens.id, tokenId));
  }

  // Stripe data queries (from stripe schema managed by stripe-replit-sync)
  async getProduct(productId: string): Promise<any> {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async getSubscription(subscriptionId: string): Promise<any> {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  async listProductsWithPrices(): Promise<any[]> {
    const result = await db.execute(
      sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
        ORDER BY p.id, pr.unit_amount
      `
    );
    return result.rows;
  }
}

export const storage = new DatabaseStorage();

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, index, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Auth provider enum type
export const authProviderSchema = z.enum(["google", "apple", "email"]);
export type AuthProvider = z.infer<typeof authProviderSchema>;

// Session storage table - Express session store
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Extended for OAuth + Stripe
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  emailVerified: boolean("email_verified").default(false),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  authProvider: varchar("auth_provider", { length: 20 }),
  providerUserId: varchar("provider_user_id"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  captionUsageCount: integer("caption_usage_count").default(0).notNull(),
  tier: varchar("tier", { length: 20 }).default("free").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Magic link tokens for email authentication
export const magicTokens = pgTable("magic_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  tokenHash: varchar("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_magic_tokens_email").on(table.email),
  index("IDX_magic_tokens_hash").on(table.tokenHash),
]);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Saved captions table - Database persistence instead of localStorage
export const savedCaptions = pgTable("saved_captions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  style: varchar("style", { length: 50 }).notNull(),
  context: text("context"),
  imageSrc: text("image_src"),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

export const insertSavedCaptionSchema = createInsertSchema(savedCaptions).omit({
  id: true,
  savedAt: true,
});

export type InsertSavedCaption = z.infer<typeof insertSavedCaptionSchema>;
export type SavedCaptionDB = typeof savedCaptions.$inferSelect;

// Caption styles enum
export const captionStyleSchema = z.enum([
  "professional",
  "friendly", 
  "funny",
  "minimalist",
  "inspirational",
  "casual"
]);

export type CaptionStyle = z.infer<typeof captionStyleSchema>;

// Caption request validation
export const captionRequestSchema = z.object({
  style: captionStyleSchema,
  context: z.string().optional(),
});

export type CaptionRequest = z.infer<typeof captionRequestSchema>;

// Caption response types
export const captionVariantSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const captionResponseSchema = z.object({
  captions: z.array(z.object({
    imageIndex: z.number(),
    fileName: z.string(),
    variants: z.array(captionVariantSchema),
  })),
});

export type CaptionVariant = z.infer<typeof captionVariantSchema>;
export type CaptionResponse = z.infer<typeof captionResponseSchema>;

// Saved caption schema for frontend
export const savedCaptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  style: captionStyleSchema,
  context: z.string().optional(),
  imageSrc: z.string().optional(),
  savedAt: z.string(),
});

export type SavedCaption = z.infer<typeof savedCaptionSchema>;

// Subscription tier type
export type SubscriptionTier = "free" | "pro";

// Constants
export const FREE_TIER_LIMIT = 10;
export const PRO_PRICE_MONTHLY = 999; // $9.99 in cents

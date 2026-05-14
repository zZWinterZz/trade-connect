import {
  pgTable, pgEnum, text, boolean, timestamp, uuid,
  real, integer, doublePrecision, unique, check,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ─── Better Auth tables (camelCase — required by the drizzle adapter) ─────────

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

// ─── App enums ────────────────────────────────────────────────────────────────

export const businessTypeEnum = pgEnum('business_type', ['supplier', 'buyer', 'both'])
export const businessCategoryEnum = pgEnum('business_category', [
  'food & beverage', 'linen & laundry', 'cleaning supplies', 'maintenance', 'logistics', 'other',
])
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'pro'])
export const connectionStatusEnum = pgEnum('connection_status', ['pending', 'accepted', 'declined'])
export const frequencyEnum = pgEnum('frequency_type', ['daily', 'weekly', 'monthly', 'one-off'])
export const urgencyEnum = pgEnum('urgency_type', ['low', 'medium', 'high'])

// ─── App tables (snake_case — matches types/index.ts) ─────────────────────────

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  created_at: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  name: text('name').notNull(),
  description: text('description'),
  website: text('website'),
  business_type: businessTypeEnum('business_type').notNull().default('both'),
  category: businessCategoryEnum('category').notNull(),
  address: text('address'),
  city: text('city'),
  postcode: text('postcode'),
  country: text('country').notNull().default('United Kingdom'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  contact_name: text('contact_name'),
  contact_email: text('contact_email'),
  contact_phone: text('contact_phone'),
  subscription_tier: subscriptionTierEnum('subscription_tier').notNull().default('free'),
  verified: boolean('verified').notNull().default(false),
  owner_id: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  sync_token: text('sync_token').unique(),
  last_synced_at: timestamp('last_synced_at', { mode: 'string' }),
})

export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  product_name: text('product_name').notNull(),
  description: text('description'),
  unit: text('unit'),
  price_from: real('price_from'),
  min_order_qty: integer('min_order_qty'),
  lead_time_days: integer('lead_time_days'),
  in_stock: boolean('in_stock').notNull().default(true),
  category: businessCategoryEnum('category').notNull(),
  external_id: text('external_id'),
})

export const needs = pgTable('needs', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  product_name: text('product_name').notNull(),
  description: text('description'),
  frequency: frequencyEnum('frequency').notNull().default('weekly'),
  quantity: integer('quantity'),
  unit: text('unit'),
  urgency: urgencyEnum('urgency').notNull().default('medium'),
})

export const connections = pgTable('connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  created_at: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  requester_id: uuid('requester_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  recipient_id: uuid('recipient_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  status: connectionStatusEnum('status').notNull().default('pending'),
  message: text('message'),
}, (t) => [
  unique().on(t.requester_id, t.recipient_id),
  check('no_self_connect', sql`${t.requester_id} != ${t.recipient_id}`),
])

// ─── Relations ────────────────────────────────────────────────────────────────

export const businessesRelations = relations(businesses, ({ many }) => ({
  listings: many(listings),
  needs: many(needs),
  sentConnections: many(connections, { relationName: 'requester' }),
  receivedConnections: many(connections, { relationName: 'recipient' }),
}))

export const listingsRelations = relations(listings, ({ one }) => ({
  business: one(businesses, { fields: [listings.business_id], references: [businesses.id] }),
}))

export const needsRelations = relations(needs, ({ one }) => ({
  business: one(businesses, { fields: [needs.business_id], references: [businesses.id] }),
}))

export const connectionsRelations = relations(connections, ({ one }) => ({
  requester: one(businesses, {
    fields: [connections.requester_id],
    references: [businesses.id],
    relationName: 'requester',
  }),
  recipient: one(businesses, {
    fields: [connections.recipient_id],
    references: [businesses.id],
    relationName: 'recipient',
  }),
}))

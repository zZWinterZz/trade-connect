/**
 * Seed script — 20 London hospitality businesses.
 *
 * Inserts directly into the DB via Drizzle (no HTTP auth API needed).
 *
 * Usage:
 *   1. docker compose up -d
 *   2. npm run db:push   (or the raw-SQL equivalent)
 *   3. npm run seed
 */

// Load env BEFORE any other imports that read process.env
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { randomUUID } from 'crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { user, account, businesses, listings, needs } from '../lib/db/schema'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { hashPassword } = require('@better-auth/utils/password') as {
  hashPassword: (p: string) => Promise<string>
}

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

const SEED_PASSWORD = 'SeedPass123!'

// ── Users ────────────────────────────────────────────────────────────────────

const users = [
  { email: 'metro.linen@seed.tc', name: 'Sarah Collins' },
  { email: 'fresh.fields@seed.tc', name: 'Tom Hartley' },
  { email: 'borough.hotel@seed.tc', name: 'James Reed' },
  { email: 'cleanpro@seed.tc', name: 'Rachel Moore' },
  { email: 'swift.logistics@seed.tc', name: 'Kevin Walsh' },
  { email: 'sourdough.republic@seed.tc', name: 'Emma Clarke' },
  { email: 'atlas.maintenance@seed.tc', name: 'David Hughes' },
  { email: 'southwark.kitchens@seed.tc', name: 'Nina Patel' },
  { email: 'premier.laundry@seed.tc', name: 'Andrew Park' },
  { email: 'canopy.restaurant@seed.tc', name: 'Lucy Chan' },
  { email: 'greenwich.meats@seed.tc', name: 'Mark Butcher' },
  { email: 'bright.clean@seed.tc', name: 'Priya Sharma' },
  { email: 'city.courier@seed.tc', name: 'Hassan Ali' },
  { email: 'marble.arch.hotel@seed.tc', name: 'Sophie Blackwood' },
  { email: 'dalston.deli@seed.tc', name: 'Cara Flynn' },
  { email: 'nordic.linen@seed.tc', name: 'Ingrid Larsson' },
  { email: 'fix.it.services@seed.tc', name: 'Gary Osei' },
  { email: 'spitalfields.bistro@seed.tc', name: 'Laurent Dupont' },
  { email: 'eco.clean@seed.tc', name: 'Alicia Okafor' },
  { email: 'crossrail.freight@seed.tc', name: 'Michael Tran' },
]

// ── Business profiles ─────────────────────────────────────────────────────────

const bizProfiles = [
  { name: 'Metro Linen Services', description: 'Commercial linen hire and laundry for hotels and restaurants. Same-day turnaround available.', business_type: 'supplier', category: 'linen & laundry', address: '14 Bermondsey Street', city: 'London', postcode: 'SE1 3UD', lat: 51.4995, lng: -0.0798, subscription_tier: 'pro', verified: true },
  { name: 'Fresh Fields Produce', description: 'Wholesale fruit and vegetables from UK farms, delivering six days a week to London hospitality.', business_type: 'supplier', category: 'food & beverage', address: '32 New Covent Garden Market', city: 'London', postcode: 'SW8 5BH', lat: 51.4816, lng: -0.1277, subscription_tier: 'pro', verified: true },
  { name: 'The Borough Hotel', description: 'Boutique hotel with 48 rooms seeking reliable linen, cleaning, and fresh produce suppliers.', business_type: 'buyer', category: 'linen & laundry', address: '21 Borough High Street', city: 'London', postcode: 'SE1 1JA', lat: 51.5024, lng: -0.0916, subscription_tier: 'free', verified: false },
  { name: 'CleanPro Supplies', description: 'Trade supplier of professional cleaning chemicals, equipment and disposables for hospitality.', business_type: 'supplier', category: 'cleaning supplies', address: '8 Elephant Road', city: 'London', postcode: 'SE17 1LB', lat: 51.4942, lng: -0.1000, subscription_tier: 'pro', verified: true },
  { name: 'Swift Logistics London', description: 'Same-day and scheduled delivery for food and hospitality supplies across London.', business_type: 'supplier', category: 'logistics', address: '55 Old Kent Road', city: 'London', postcode: 'SE1 5BD', lat: 51.4923, lng: -0.0724, subscription_tier: 'pro', verified: false },
  { name: 'Sourdough Republic', description: 'Artisan bakery producing sourdough, pastries and specialty rolls for restaurants, hotels and cafes.', business_type: 'supplier', category: 'food & beverage', address: '67 Maltby Street', city: 'London', postcode: 'SE1 3PA', lat: 51.4990, lng: -0.0737, subscription_tier: 'free', verified: false },
  { name: 'Atlas Building Services', description: 'Planned and reactive maintenance for commercial kitchens, HVAC, plumbing and property repairs.', business_type: 'supplier', category: 'maintenance', address: '12 Newington Causeway', city: 'London', postcode: 'SE1 6BN', lat: 51.4983, lng: -0.0976, subscription_tier: 'pro', verified: true },
  { name: 'Southwark Kitchen Rentals', description: 'Dark kitchen and prep kitchen facilities for hire by the hour or day, with logistics support.', business_type: 'both', category: 'food & beverage', address: '3 Tanner Street', city: 'London', postcode: 'SE1 3LE', lat: 51.5003, lng: -0.0769, subscription_tier: 'free', verified: false },
  { name: 'Premier Laundry Group', description: 'Industrial laundry for large hospitality groups — tablecloths, chef whites, spa towels.', business_type: 'supplier', category: 'linen & laundry', address: '29 Wandsworth Road', city: 'London', postcode: 'SW8 2JH', lat: 51.4771, lng: -0.1325, subscription_tier: 'pro', verified: true },
  { name: 'Canopy Restaurant Group', description: 'Award-winning group of three SE London restaurants sourcing seasonal British produce.', business_type: 'buyer', category: 'food & beverage', address: '44 Camberwell Church Street', city: 'London', postcode: 'SE5 8QZ', lat: 51.4742, lng: -0.0873, subscription_tier: 'pro', verified: false },
  { name: 'Greenwich Meats', description: 'Family-run butcher supplying premium British beef, lamb, and poultry to restaurants and caterers.', business_type: 'supplier', category: 'food & beverage', address: '18 Creek Road', city: 'London', postcode: 'SE8 3BU', lat: 51.4788, lng: -0.0219, subscription_tier: 'free', verified: false },
  { name: 'Bright Clean Commercial', description: 'Deep clean and daily contract cleaning for restaurants, hotel common areas and event venues.', business_type: 'supplier', category: 'cleaning supplies', address: '77 Stockwell Road', city: 'London', postcode: 'SW9 9PQ', lat: 51.4726, lng: -0.1199, subscription_tier: 'free', verified: false },
  { name: 'City Courier Solutions', description: 'Temperature-controlled delivery for perishable food and beverage across inner and outer London.', business_type: 'supplier', category: 'logistics', address: '91 Commercial Road', city: 'London', postcode: 'E1 1RD', lat: 51.5139, lng: -0.0622, subscription_tier: 'pro', verified: false },
  { name: 'Marble Arch Hotel', description: 'Four-star central London hotel requiring linen hire, cleaning, fresh produce and maintenance.', business_type: 'buyer', category: 'linen & laundry', address: '19 Bryanston Street', city: 'London', postcode: 'W1H 7EE', lat: 51.5145, lng: -0.1616, subscription_tier: 'pro', verified: true },
  { name: 'Dalston Deli & Catering', description: 'Independent deli and catering company looking for local produce and logistics partners.', business_type: 'both', category: 'food & beverage', address: '35 Kingsland High Street', city: 'London', postcode: 'E8 2JS', lat: 51.5468, lng: -0.0713, subscription_tier: 'free', verified: false },
  { name: 'Nordic Linen Supply', description: 'Scandinavian-quality table linen and uniforms for high-end hospitality. Custom embroidery available.', business_type: 'supplier', category: 'linen & laundry', address: '6 Hornton Street', city: 'London', postcode: 'W8 4NR', lat: 51.5012, lng: -0.1941, subscription_tier: 'pro', verified: true },
  { name: 'Fix-It Trade Services', description: 'Commercial kitchen engineers, refrigeration specialists and gas-safe engineers available 24/7.', business_type: 'supplier', category: 'maintenance', address: '48 Haverstock Hill', city: 'London', postcode: 'NW3 2BN', lat: 51.5561, lng: -0.1607, subscription_tier: 'free', verified: false },
  { name: 'Spitalfields Bistro', description: 'French-British bistro looking for regular suppliers of cheeses, charcuterie and table linen.', business_type: 'buyer', category: 'food & beverage', address: '7 Lamb Street', city: 'London', postcode: 'E1 6EA', lat: 51.5197, lng: -0.0730, subscription_tier: 'free', verified: false },
  { name: 'Eco Clean London', description: 'Plant-based cleaning products and services. B-Corp certified. Serving hospitality and offices.', business_type: 'supplier', category: 'cleaning supplies', address: '23 Caledonian Road', city: 'London', postcode: 'N1 9DX', lat: 51.5358, lng: -0.1195, subscription_tier: 'pro', verified: true },
  { name: 'Crossrail Freight Partners', description: 'Overnight and early-morning delivery specialists. Hub at Stratford covering east and central London.', business_type: 'supplier', category: 'logistics', address: '11 Stratford High Street', city: 'London', postcode: 'E15 2AJ', lat: 51.5413, lng: -0.0043, subscription_tier: 'free', verified: false },
] as const

// ── Listings ──────────────────────────────────────────────────────────────────

type ListingRow = { product_name: string; description?: string; unit?: string; price_from?: number; min_order_qty?: number; lead_time_days?: number; in_stock: boolean; category: string }
const listingsByIndex: Record<number, ListingRow[]> = {
  0: [{ product_name: 'Hotel table linen hire', description: 'White cotton tablecloths and napkins, 5-star laundered', unit: 'per piece/week', price_from: 0.45, min_order_qty: 50, lead_time_days: 1, in_stock: true, category: 'linen & laundry' }],
  1: [
    { product_name: 'Seasonal mixed salad box', description: 'Mixed UK leaves, 5 varieties, weekly rotation', unit: '5kg box', price_from: 18, min_order_qty: 2, lead_time_days: 1, in_stock: true, category: 'food & beverage' },
    { product_name: 'Heritage tomato selection', description: 'Five varieties, greenhouse grown', unit: '3kg tray', price_from: 12, min_order_qty: 1, lead_time_days: 1, in_stock: true, category: 'food & beverage' },
  ],
  3: [{ product_name: 'Commercial kitchen degreaser', description: 'Heavy-duty, food-safe', unit: '5L bottle', price_from: 8.50, min_order_qty: 6, lead_time_days: 2, in_stock: true, category: 'cleaning supplies' }],
  4: [{ product_name: 'Same-day delivery — inner London', description: 'Up to 500kg, temperature-controlled', unit: 'per run', price_from: 45, lead_time_days: 0, in_stock: true, category: 'logistics' }],
  5: [
    { product_name: 'Sourdough loaf — white', unit: 'loaf (800g)', price_from: 3.20, min_order_qty: 10, lead_time_days: 1, in_stock: true, category: 'food & beverage' },
    { product_name: 'Pain au chocolat — catering pack', unit: 'pack of 24', price_from: 22, min_order_qty: 2, lead_time_days: 1, in_stock: true, category: 'food & beverage' },
  ],
  6: [{ product_name: 'Commercial kitchen maintenance contract', description: 'Quarterly service, 24hr call-out', unit: 'per annum', price_from: 1200, lead_time_days: 3, in_stock: true, category: 'maintenance' }],
  8: [{ product_name: 'Chef whites laundry — weekly collection', unit: 'per piece', price_from: 1.20, min_order_qty: 20, lead_time_days: 2, in_stock: true, category: 'linen & laundry' }],
  10: [
    { product_name: 'Dry-aged ribeye steak', unit: 'kg', price_from: 32, min_order_qty: 2, lead_time_days: 1, in_stock: true, category: 'food & beverage' },
    { product_name: 'Free-range whole chicken', unit: 'each (~1.8kg)', price_from: 9.50, min_order_qty: 5, lead_time_days: 1, in_stock: true, category: 'food & beverage' },
  ],
  12: [{ product_name: 'Temperature-controlled courier — central London', unit: 'per delivery', price_from: 28, lead_time_days: 0, in_stock: true, category: 'logistics' }],
  15: [{ product_name: 'Restaurant tablecloths — white 70x70', unit: 'per piece/week', price_from: 0.55, min_order_qty: 30, lead_time_days: 2, in_stock: true, category: 'linen & laundry' }],
  16: [{ product_name: 'Commercial refrigeration repair', description: 'Gas safe registered, 24/7', unit: 'per callout', price_from: 95, lead_time_days: 0, in_stock: true, category: 'maintenance' }],
  18: [
    { product_name: 'Plant-based kitchen cleaner', unit: '5L', price_from: 11, min_order_qty: 4, lead_time_days: 2, in_stock: true, category: 'cleaning supplies' },
    { product_name: 'Eco floor cleaner concentrate', unit: '5L', price_from: 9, min_order_qty: 4, lead_time_days: 2, in_stock: true, category: 'cleaning supplies' },
  ],
  19: [{ product_name: 'Overnight pallet delivery — east London', unit: 'per pallet', price_from: 65, lead_time_days: 1, in_stock: true, category: 'logistics' }],
}

// ── Needs ─────────────────────────────────────────────────────────────────────

type NeedRow = { product_name: string; description?: string; frequency: string; quantity?: number; unit?: string; urgency: string }
const needsByIndex: Record<number, NeedRow[]> = {
  2: [
    { product_name: 'Hotel linen hire', description: 'Bed sheets, pillowcases, bath towels for 48 rooms', frequency: 'weekly', quantity: 200, unit: 'pieces', urgency: 'high' },
    { product_name: 'Commercial cleaning products', description: 'Bathroom, kitchen and floor products', frequency: 'monthly', urgency: 'medium' },
    { product_name: 'Fresh continental breakfast produce', description: 'Pastries, bread, fruit, cold cuts', frequency: 'daily', urgency: 'high' },
  ],
  7: [
    { product_name: 'Fresh vegetables and salad', frequency: 'weekly', quantity: 20, unit: 'kg', urgency: 'medium' },
    { product_name: 'Logistics — kitchen deliveries', description: 'Early morning 06:00–08:00', frequency: 'daily', urgency: 'high' },
  ],
  9: [
    { product_name: 'Artisan bread and pastries', description: 'Sourdough and viennoiserie', frequency: 'daily', urgency: 'high' },
    { product_name: 'Cleaning chemicals', description: 'Food-safe, eco preferred', frequency: 'monthly', urgency: 'low' },
    { product_name: 'Linen hire — napkins and tablecloths', frequency: 'weekly', quantity: 300, unit: 'pieces', urgency: 'medium' },
  ],
  13: [
    { product_name: 'Linen hire — hotel rooms', description: '120 rooms, full change weekly', frequency: 'weekly', quantity: 500, unit: 'pieces', urgency: 'high' },
    { product_name: 'Fresh food — restaurant and breakfast', frequency: 'daily', urgency: 'high' },
    { product_name: 'Maintenance contract', description: 'Plumbing, HVAC, electrical', frequency: 'monthly', urgency: 'medium' },
  ],
  14: [
    { product_name: 'Fresh charcuterie and cheese', description: 'French-style selection', frequency: 'weekly', urgency: 'medium' },
    { product_name: 'Linen hire — table and napkins', frequency: 'weekly', quantity: 80, unit: 'pieces', urgency: 'medium' },
    { product_name: 'Eco cleaning products', frequency: 'monthly', urgency: 'low' },
  ],
  17: [
    { product_name: 'Fresh produce', description: 'Vegetables, fruit, herbs — local preferred', frequency: 'weekly', urgency: 'medium' },
    { product_name: 'Artisan bread', description: 'Sourdough and baguettes', frequency: 'daily', urgency: 'high' },
    { product_name: 'Linen hire — tablecloths and napkins', frequency: 'weekly', urgency: 'medium' },
  ],
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding ${users.length} businesses...\n`)

  const passwordHash = await hashPassword(SEED_PASSWORD)
  const now = new Date()
  const bizIds: string[] = []

  for (let i = 0; i < users.length; i++) {
    const u = users[i]
    const profile = bizProfiles[i]

    // Create Better Auth user record directly
    const userId = randomUUID()
    await db.insert(user).values({
      id: userId,
      name: u.name,
      email: u.email,
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing()

    // Create Better Auth account record (email/password provider)
    await db.insert(account).values({
      id: randomUUID(),
      accountId: u.email,
      providerId: 'credential',
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing()

    // Create business
    const [biz] = await db
      .insert(businesses)
      .values({
        owner_id: userId,
        name: profile.name,
        description: profile.description,
        business_type: profile.business_type as 'supplier' | 'buyer' | 'both',
        category: profile.category as 'food & beverage' | 'linen & laundry' | 'cleaning supplies' | 'maintenance' | 'logistics' | 'other',
        address: profile.address,
        city: profile.city,
        postcode: profile.postcode,
        lat: profile.lat,
        lng: profile.lng,
        contact_name: u.name,
        contact_email: u.email,
        subscription_tier: profile.subscription_tier as 'free' | 'pro',
        verified: profile.verified,
      })
      .returning()

    bizIds.push(biz.id)
    console.log(`  [${i + 1}/20] ${profile.name} (${profile.postcode})`)

    // Listings
    const bizListings = listingsByIndex[i]
    if (bizListings) {
      for (const l of bizListings) {
        await db.insert(listings).values({
          business_id: biz.id,
          product_name: l.product_name,
          description: l.description ?? null,
          unit: l.unit ?? null,
          price_from: l.price_from ?? null,
          min_order_qty: l.min_order_qty ?? null,
          lead_time_days: l.lead_time_days ?? null,
          in_stock: l.in_stock,
          category: l.category as 'food & beverage' | 'linen & laundry' | 'cleaning supplies' | 'maintenance' | 'logistics' | 'other',
        })
      }
    }

    // Needs
    const bizNeeds = needsByIndex[i]
    if (bizNeeds) {
      for (const n of bizNeeds) {
        await db.insert(needs).values({
          business_id: biz.id,
          product_name: n.product_name,
          description: n.description ?? null,
          frequency: n.frequency as 'daily' | 'weekly' | 'monthly' | 'one-off',
          quantity: n.quantity ?? null,
          unit: n.unit ?? null,
          urgency: n.urgency as 'low' | 'medium' | 'high',
        })
      }
    }
  }

  console.log(`\nSeed complete — ${bizIds.length} businesses created.`)
  console.log(`All seed accounts use password: ${SEED_PASSWORD}`)
  console.log(`Example logins:`)
  console.log(`  metro.linen@seed.tc  — Metro Linen Services (Pro, Verified)`)
  console.log(`  borough.hotel@seed.tc — The Borough Hotel (buyer)`)
  console.log(`  canopy.restaurant@seed.tc — Canopy Restaurant Group (Pro buyer)`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

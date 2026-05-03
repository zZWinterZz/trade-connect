'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { businesses, listings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { BusinessCategory } from '@/types'

async function getOwnedBusiness(userId: string) {
  return db.query.businesses.findFirst({ where: eq(businesses.owner_id, userId) })
}

export async function createListing(data: {
  product_name: string
  description?: string
  unit?: string
  price_from?: number
  min_order_qty?: number
  lead_time_days?: number
  in_stock: boolean
  category: BusinessCategory
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const biz = await getOwnedBusiness(session.user.id)
  if (!biz) return { error: 'Business not found' }

  const [row] = await db
    .insert(listings)
    .values({
      business_id: biz.id,
      product_name: data.product_name,
      description: data.description ?? null,
      unit: data.unit ?? null,
      price_from: data.price_from ?? null,
      min_order_qty: data.min_order_qty ?? null,
      lead_time_days: data.lead_time_days ?? null,
      in_stock: data.in_stock,
      category: data.category,
    })
    .returning()

  revalidatePath('/listings')
  return { data: row }
}

export async function updateListing(id: string, data: {
  product_name: string
  description?: string
  unit?: string
  price_from?: number
  min_order_qty?: number
  lead_time_days?: number
  in_stock: boolean
  category: BusinessCategory
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const biz = await getOwnedBusiness(session.user.id)
  if (!biz) return { error: 'Business not found' }

  const [row] = await db
    .update(listings)
    .set({
      product_name: data.product_name,
      description: data.description ?? null,
      unit: data.unit ?? null,
      price_from: data.price_from ?? null,
      min_order_qty: data.min_order_qty ?? null,
      lead_time_days: data.lead_time_days ?? null,
      in_stock: data.in_stock,
      category: data.category,
    })
    .where(eq(listings.id, id))
    .returning()

  revalidatePath('/listings')
  return { data: row }
}

export async function toggleListingStock(id: string, inStock: boolean) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const [row] = await db
    .update(listings)
    .set({ in_stock: inStock })
    .where(eq(listings.id, id))
    .returning()

  revalidatePath('/listings')
  return { data: row }
}

export async function deleteListing(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  await db.delete(listings).where(eq(listings.id, id))
  revalidatePath('/listings')
  return { success: true }
}

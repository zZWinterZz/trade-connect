'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { businesses, listings, needs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { randomBytes } from 'crypto'
import type { BusinessCategory, BusinessType } from '@/types'

interface CreateBusinessInput {
  name: string
  description?: string
  website?: string
  business_type: BusinessType
  category: BusinessCategory
  address?: string
  city?: string
  postcode?: string
  lat?: number
  lng?: number
  contact_name?: string
  contact_email?: string
  contact_phone?: string
}

interface CreateListingInput {
  product_name: string
  description?: string
  unit?: string
  price_from?: number
  category: BusinessCategory
  in_stock: boolean
}

interface CreateNeedInput {
  product_name: string
  description?: string
  frequency: string
  quantity?: number
  unit?: string
  urgency: string
}

export async function createBusiness(
  bizData: CreateBusinessInput,
  listingData?: CreateListingInput,
  needData?: CreateNeedInput,
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const [biz] = await db
    .insert(businesses)
    .values({
      owner_id: session.user.id,
      sync_token: randomBytes(24).toString('hex'),
      name: bizData.name,
      description: bizData.description ?? null,
      website: bizData.website ?? null,
      business_type: bizData.business_type,
      category: bizData.category,
      address: bizData.address ?? null,
      city: bizData.city ?? null,
      postcode: bizData.postcode ?? null,
      lat: bizData.lat ?? null,
      lng: bizData.lng ?? null,
      contact_name: bizData.contact_name ?? null,
      contact_email: bizData.contact_email ?? session.user.email,
      contact_phone: bizData.contact_phone ?? null,
    })
    .returning()

  if (listingData?.product_name) {
    await db.insert(listings).values({
      business_id: biz.id,
      product_name: listingData.product_name,
      description: listingData.description ?? null,
      unit: listingData.unit ?? null,
      price_from: listingData.price_from ?? null,
      category: listingData.category,
      in_stock: listingData.in_stock,
    })
  }

  if (needData?.product_name) {
    await db.insert(needs).values({
      business_id: biz.id,
      product_name: needData.product_name,
      description: needData.description ?? null,
      frequency: needData.frequency as 'daily' | 'weekly' | 'monthly' | 'one-off',
      quantity: needData.quantity ?? null,
      unit: needData.unit ?? null,
      urgency: needData.urgency as 'low' | 'medium' | 'high',
    })
  }

  return { success: true, businessId: biz.id }
}

export async function getMyBusiness() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  return db.query.businesses.findFirst({ where: eq(businesses.owner_id, session.user.id) })
}

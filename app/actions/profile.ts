'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { businesses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { BusinessCategory, BusinessType } from '@/types'

export async function updateProfile(data: {
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
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const [row] = await db
    .update(businesses)
    .set({
      name: data.name,
      description: data.description ?? null,
      website: data.website ?? null,
      business_type: data.business_type,
      category: data.category,
      address: data.address ?? null,
      city: data.city ?? null,
      postcode: data.postcode ?? null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      contact_name: data.contact_name ?? null,
      contact_email: data.contact_email ?? null,
      contact_phone: data.contact_phone ?? null,
    })
    .where(eq(businesses.owner_id, session.user.id))
    .returning()

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { data: row }
}

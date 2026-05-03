'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { businesses, needs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { Frequency, Urgency } from '@/types'

async function getOwnedBusiness(userId: string) {
  return db.query.businesses.findFirst({ where: eq(businesses.owner_id, userId) })
}

export async function createNeed(data: {
  product_name: string
  description?: string
  frequency: Frequency
  quantity?: number
  unit?: string
  urgency: Urgency
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const biz = await getOwnedBusiness(session.user.id)
  if (!biz) return { error: 'Business not found' }

  const [row] = await db
    .insert(needs)
    .values({
      business_id: biz.id,
      product_name: data.product_name,
      description: data.description ?? null,
      frequency: data.frequency,
      quantity: data.quantity ?? null,
      unit: data.unit ?? null,
      urgency: data.urgency,
    })
    .returning()

  revalidatePath('/needs')
  return { data: row }
}

export async function updateNeed(id: string, data: {
  product_name: string
  description?: string
  frequency: Frequency
  quantity?: number
  unit?: string
  urgency: Urgency
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const [row] = await db
    .update(needs)
    .set({
      product_name: data.product_name,
      description: data.description ?? null,
      frequency: data.frequency,
      quantity: data.quantity ?? null,
      unit: data.unit ?? null,
      urgency: data.urgency,
    })
    .where(eq(needs.id, id))
    .returning()

  revalidatePath('/needs')
  return { data: row }
}

export async function deleteNeed(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  await db.delete(needs).where(eq(needs.id, id))
  revalidatePath('/needs')
  return { success: true }
}

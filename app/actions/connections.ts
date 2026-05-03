'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { businesses, connections } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getOwnedBusiness(userId: string) {
  return db.query.businesses.findFirst({ where: eq(businesses.owner_id, userId) })
}

export async function sendConnectionRequest(recipientId: string, message?: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const biz = await getOwnedBusiness(session.user.id)
  if (!biz) return { error: 'Business not found' }

  try {
    const [row] = await db
      .insert(connections)
      .values({
        requester_id: biz.id,
        recipient_id: recipientId,
        message: message ?? null,
        status: 'pending',
      })
      .returning()

    revalidatePath('/connections')
    revalidatePath('/matches')
    return { data: row }
  } catch {
    return { error: 'Could not send request — already connected or request pending' }
  }
}

export async function updateConnectionStatus(id: string, status: 'accepted' | 'declined') {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const [row] = await db
    .update(connections)
    .set({ status })
    .where(eq(connections.id, id))
    .returning()

  revalidatePath('/connections')
  return { data: row }
}

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { businesses, needs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import TopBar from '@/components/layout/TopBar'
import NeedsManager from './NeedsManager'
import type { Business, Need } from '@/types'

export default async function NeedsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.owner_id, session.user.id),
  }) as Business | undefined

  if (!business) redirect('/register')

  const rows = await db
    .select()
    .from(needs)
    .where(eq(needs.business_id, business.id))
    .orderBy(desc(needs.created_at))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="My Needs" subtitle="Products and services you want to source" />
      <div className="flex-1 overflow-y-auto p-6">
        <NeedsManager business={business} initialNeeds={rows as unknown as Need[]} />
      </div>
    </div>
  )
}

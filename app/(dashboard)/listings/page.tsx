import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { businesses, listings } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import TopBar from '@/components/layout/TopBar'
import ListingsManager from './ListingsManager'
import type { Business, Listing } from '@/types'

export default async function ListingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.owner_id, session.user.id),
  }) as Business | undefined

  if (!business) redirect('/register')

  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.business_id, business.id))
    .orderBy(desc(listings.created_at))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="My Listings" subtitle="Products and services you supply" />
      <div className="flex-1 overflow-y-auto p-6">
        <ListingsManager business={business} initialListings={rows as unknown as Listing[]} />
      </div>
    </div>
  )
}

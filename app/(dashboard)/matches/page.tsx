import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { businesses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import TopBar from '@/components/layout/TopBar'
import MatchesPanel from '@/components/cards/MatchesPanel'
import type { Business } from '@/types'

export default async function MatchesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.owner_id, session.user.id),
  }) as Business | undefined

  if (!business) redirect('/register')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Matches" subtitle="Businesses compatible with your listings and needs" />
      <div className="flex-1 overflow-y-auto p-6">
        <MatchesPanel myBusiness={business} />
      </div>
    </div>
  )
}

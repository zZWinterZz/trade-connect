import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { businesses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import TopBar from '@/components/layout/TopBar'
import ProfileEditor from './ProfileEditor'
import type { Business } from '@/types'

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.owner_id, session.user.id),
  }) as Business | undefined

  if (!business) redirect('/register')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Business Profile" subtitle="Manage your public listing on TradeConnect" />
      <div className="flex-1 overflow-y-auto p-6">
        <ProfileEditor business={business} userEmail={session.user.email} />
      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { businesses, connections } from '@/lib/db/schema'
import { eq, or, desc } from 'drizzle-orm'
import TopBar from '@/components/layout/TopBar'
import ConnectionsManager from './ConnectionsManager'
import type { Business } from '@/types'

export default async function ConnectionsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.owner_id, session.user.id),
  }) as Business | undefined

  if (!business) redirect('/register')

  const rows = await db.query.connections.findMany({
    where: or(
      eq(connections.requester_id, business.id),
      eq(connections.recipient_id, business.id),
    ),
    with: {
      requester: true,
      recipient: true,
    },
    orderBy: [desc(connections.created_at)],
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Connections" subtitle="Your network of business contacts" />
      <div className="flex-1 overflow-y-auto p-6">
        <ConnectionsManager myBusiness={business} initialConnections={rows as never} />
      </div>
    </div>
  )
}

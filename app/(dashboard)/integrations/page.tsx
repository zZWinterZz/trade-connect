import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { businesses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import IntegrationsClient from './IntegrationsClient'

export default async function IntegrationsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const biz = await db.query.businesses.findFirst({
    where: eq(businesses.owner_id, session.user.id),
  })
  if (!biz) redirect('/dashboard')

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Integrations</h1>
      <p className="text-sm text-gray-500 mb-8">
        Connect your internal systems to automatically sync stock and prices into your TradeConnect listings.
      </p>
      <IntegrationsClient
        businessId={biz.id}
        syncToken={biz.sync_token ?? null}
        lastSyncedAt={biz.last_synced_at ?? null}
      />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { businesses, listings, needs, connections } from '@/lib/db/schema'
import { eq, or, count } from 'drizzle-orm'
import TopBar from '@/components/layout/TopBar'
import MatchesPanel from '@/components/cards/MatchesPanel'
import { Building2, Package, ShoppingCart, Link2, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { Business } from '@/types'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.owner_id, session.user.id),
  }) as Business | undefined

  if (!business) redirect('/register')

  const [[{ listingsCount }], [{ needsCount }], allConns] = await Promise.all([
    db.select({ listingsCount: count() }).from(listings).where(eq(listings.business_id, business.id)),
    db.select({ needsCount: count() }).from(needs).where(eq(needs.business_id, business.id)),
    db.select({ status: connections.status, recipient_id: connections.recipient_id })
      .from(connections)
      .where(or(eq(connections.requester_id, business.id), eq(connections.recipient_id, business.id))),
  ])

  const activeConnections = allConns.filter((c) => c.status === 'accepted').length
  const pendingIncoming = allConns.filter(
    (c) => c.status === 'pending' && c.recipient_id === business.id
  ).length

  const stats = [
    { icon: Package, label: 'Listings', value: listingsCount, href: '/listings', color: 'text-blue-600 bg-blue-50' },
    { icon: ShoppingCart, label: 'Needs', value: needsCount, href: '/needs', color: 'text-amber-600 bg-amber-50' },
    { icon: Link2, label: 'Connections', value: activeConnections, href: '/connections', color: 'text-teal-600 bg-teal-50' },
    { icon: TrendingUp, label: 'Pending requests', value: pendingIncoming, href: '/connections', color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title={`Welcome back, ${business.contact_name || business.name}`}
        subtitle={business.city ? `${business.name} · ${business.city}` : business.name}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!business.lat && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-900">Complete your profile to appear in matches</p>
              <p className="text-xs text-amber-700 mt-0.5">Add your postcode so we can find nearby businesses</p>
            </div>
            <Link href="/profile" className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors">
              Update profile
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value, href, color }) => (
            <Link key={label} href={href} className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3 hover:border-teal-200 hover:shadow-sm transition-all">
              <div className={`rounded-lg p-2 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700 font-bold text-lg">
              {business.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">{business.name}</h2>
                {business.verified && (
                  <span className="rounded-full bg-teal-700 px-2 py-0.5 text-xs font-medium text-white">Verified</span>
                )}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 capitalize">{business.subscription_tier}</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{business.category} · {business.business_type}</p>
              {business.city && <p className="text-xs text-gray-400 mt-0.5">{business.city}{business.postcode ? `, ${business.postcode}` : ''}</p>}
            </div>
          </div>
          <Link href="/profile" className="text-xs text-teal-700 hover:text-teal-800 font-medium">Edit profile</Link>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Your matches</h2>
            <Link href="/matches" className="text-xs text-teal-700 hover:text-teal-800 font-medium">View all</Link>
          </div>
          <MatchesPanel myBusiness={business} previewLimit={3} />
        </div>
      </div>
    </div>
  )
}

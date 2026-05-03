import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { businesses, listings, needs, connections } from '@/lib/db/schema'
import { eq, ne, inArray, or } from 'drizzle-orm'
import { computeMatches } from '@/lib/utils'
import type { Business, Listing, Need } from '@/types'

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const radiusKm = parseInt(searchParams.get('radius') ?? '40')

  const myBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.owner_id, session.user.id),
  })
  if (!myBusiness) return Response.json({ error: 'No business profile' }, { status: 404 })

  const [myListings, myNeeds, conns] = await Promise.all([
    db.select().from(listings).where(eq(listings.business_id, myBusiness.id)),
    db.select().from(needs).where(eq(needs.business_id, myBusiness.id)),
    db.select().from(connections).where(
      or(eq(connections.requester_id, myBusiness.id), eq(connections.recipient_id, myBusiness.id))
    ),
  ])

  // Build set of connected business IDs (pending + accepted — don't re-show)
  const connectedIds = new Set<string>()
  conns.forEach((c) => {
    connectedIds.add(c.requester_id === myBusiness.id ? c.recipient_id : c.requester_id)
  })

  const otherBusinesses = await db.select().from(businesses).where(ne(businesses.id, myBusiness.id))
  if (!otherBusinesses.length) return Response.json([])

  const bizIds = otherBusinesses.map((b) => b.id)
  const [allListings, allNeeds] = await Promise.all([
    db.select().from(listings).where(inArray(listings.business_id, bizIds)),
    db.select().from(needs).where(inArray(needs.business_id, bizIds)),
  ])

  const candidates = otherBusinesses.map((b) => ({
    business: b as unknown as Business,
    listings: allListings.filter((l) => l.business_id === b.id) as unknown as Listing[],
    needs: allNeeds.filter((n) => n.business_id === b.id) as unknown as Need[],
  }))

  const results = computeMatches(
    myBusiness as unknown as Business,
    myListings as unknown as Listing[],
    myNeeds as unknown as Need[],
    candidates,
    radiusKm,
    connectedIds,
  )

  return Response.json(results)
}

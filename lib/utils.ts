import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { BusinessCategory, MatchResult, Listing, Need, Business } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCategory(cat: BusinessCategory): string {
  return cat
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function formatDistance(km: number): string {
  const miles = km * 0.621371
  if (miles < 1) return `${Math.round(miles * 10) / 10} mi`
  return `${Math.round(miles)} mi`
}

// Haversine formula — distance between two lat/lng points in km
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

export function computeMatches(
  myBusiness: Business,
  myListings: Listing[],
  myNeeds: Need[],
  candidates: Array<{ business: Business; listings: Listing[]; needs: Need[] }>,
  radiusKm: number,
  connectedIds: Set<string>
): MatchResult[] {
  if (!myBusiness.lat || !myBusiness.lng) return []

  const myListingCategories = new Set(myListings.map((l) => l.category))
  const myNeedCategories = new Set(myNeeds.map((n) => n.product_name))

  const results: MatchResult[] = []

  for (const { business, listings, needs } of candidates) {
    if (business.id === myBusiness.id) continue
    if (connectedIds.has(business.id)) continue
    if (!business.lat || !business.lng) continue

    const distKm = haversineKm(
      myBusiness.lat,
      myBusiness.lng,
      business.lat,
      business.lng
    )
    if (distKm > radiusKm) continue

    // Category overlap: their listings match my needs OR their needs match my listings
    const theirListingCats = new Set(listings.map((l) => l.category))
    const theirNeedNames = needs.map((n) => n.product_name.toLowerCase())

    let overlapCount = 0
    myListingCategories.forEach((cat) => {
      if (theirListingCats.has(cat)) overlapCount++
    })
    theirListingCats.forEach((cat) => {
      if (myListingCategories.has(cat)) overlapCount++
    })

    // Also check by category match: their listings in my need categories
    const myNeedCatSet = new Set(myNeeds.map((n) => n.product_name.toLowerCase()))
    theirNeedNames.forEach((name) => {
      if (myNeedCatSet.has(name)) overlapCount++
    })

    const categoryOverlapScore = Math.min(overlapCount / 3, 1)

    const maxRadius = radiusKm
    const proximityScore = Math.max(0, 1 - distKm / maxRadius)

    const totalScore = categoryOverlapScore * 0.6 + proximityScore * 0.4

    results.push({
      business,
      listings,
      needs,
      distance_km: distKm,
      category_overlap_score: categoryOverlapScore,
      proximity_score: proximityScore,
      total_score: totalScore,
    })
  }

  return results.sort((a, b) => b.total_score - a.total_score)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

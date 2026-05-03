'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Business, MatchResult, BusinessCategory } from '@/types'
import { CATEGORIES, DISTANCE_OPTIONS, FREE_TIER_LIMITS } from '@/types'
import { formatCategory } from '@/lib/utils'
import MatchCard from './MatchCard'
import { Search, SlidersHorizontal } from 'lucide-react'

interface Props {
  myBusiness: Business
  previewLimit?: number
}

type SortMode = 'score' | 'distance' | 'newest'

export default function MatchesPanel({ myBusiness, previewLimit }: Props) {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [radiusKm, setRadiusKm] = useState(40)
  const [categoryFilter, setCategoryFilter] = useState<BusinessCategory | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortMode, setSortMode] = useState<SortMode>('score')
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ radius: String(radiusKm) })
      const res = await fetch(`/api/matches?${params}`)
      if (!res.ok) throw new Error('Failed to fetch matches')
      const data: MatchResult[] = await res.json()
      setMatches(data)
    } catch {
      setMatches([])
    } finally {
      setLoading(false)
    }
  }, [radiusKm, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchMatches() }, [fetchMatches])

  const isFree = myBusiness.subscription_tier === 'free'
  const maxMatches = isFree ? FREE_TIER_LIMITS.matches : Infinity

  let filtered = matches
  if (categoryFilter !== 'all') filtered = filtered.filter((m) => m.business.category === categoryFilter)
  if (typeFilter !== 'all') filtered = filtered.filter((m) => m.business.business_type === typeFilter)

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'distance') return a.distance_km - b.distance_km
    if (sortMode === 'newest') return new Date(b.business.created_at).getTime() - new Date(a.business.created_at).getTime()
    return b.total_score - a.total_score
  })

  const limited = sorted.slice(0, previewLimit ?? maxMatches)

  if (!myBusiness.lat) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
        <p className="text-sm text-gray-500">Add your postcode to your profile to see nearby matches</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters — full page only */}
      {!previewLimit && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <SlidersHorizontal className="h-4 w-4 text-gray-400 shrink-0" />
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">Radius</label>
            <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500">
              {DISTANCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as BusinessCategory | 'all')} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500">
              <option value="all">All</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{formatCategory(c)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500">
              <option value="all">All</option>
              <option value="supplier">Supplier</option>
              <option value="buyer">Buyer</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <label className="text-xs text-gray-500">Sort</label>
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500">
              <option value="score">Most relevant</option>
              <option value="distance">Nearest first</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      )}

      {!loading && (
        <p className="text-xs text-gray-500">
          {limited.length} match{limited.length !== 1 ? 'es' : ''}
          {isFree && !previewLimit && matches.length > FREE_TIER_LIMITS.matches && (
            <span className="ml-1 text-amber-600">· Upgrade to Pro to see all {matches.length}</span>
          )}
        </p>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(previewLimit ?? 3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl border border-gray-200 bg-white animate-pulse" />
          ))}
        </div>
      ) : limited.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No matches found</p>
          <p className="text-xs text-gray-400 mt-1">Try increasing the radius or adding more listings and needs</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {limited.map((match) => (
            <MatchCard
              key={match.business.id}
              match={match}
              onConnect={() => setRefreshKey((k) => k + 1)}
            />
          ))}
        </div>
      )}

      {isFree && !previewLimit && matches.length > FREE_TIER_LIMITS.matches && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-5 text-center">
          <p className="font-semibold text-teal-900 mb-1">Unlock {matches.length - FREE_TIER_LIMITS.matches} more matches</p>
          <p className="text-sm text-teal-700 mb-3">Upgrade to Pro for £49/month — unlimited matches, listings, and connections.</p>
          <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors">
            Upgrade to Pro
          </button>
        </div>
      )}
    </div>
  )
}

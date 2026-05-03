'use client'

import { MatchResult } from '@/types'
import { formatCategory, formatDistance } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { MapPin, Package, ShoppingCart, CheckCircle, Star } from 'lucide-react'
import { useState } from 'react'
import { sendConnectionRequest } from '@/app/actions/connections'

interface MatchCardProps {
  match: MatchResult
  onConnect?: () => void
}

export default function MatchCard({ match, onConnect }: MatchCardProps) {
  const { business, listings, needs, distance_km } = match
  const [connecting, setConnecting] = useState(false)
  const [message, setMessage] = useState('')
  const [showMessage, setShowMessage] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSendRequest() {
    setConnecting(true)
    setError('')
    try {
      const res = await sendConnectionRequest(business.id, message || undefined)
      if ('error' in res) throw new Error(res.error)
      setDone(true)
      setShowMessage(false)
      onConnect?.()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send request')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-4 hover:border-teal-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 font-semibold text-sm">
            {business.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-gray-900">{business.name}</span>
              {business.verified && <Star className="h-3.5 w-3.5 fill-teal-500 text-teal-500" />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="teal">{formatCategory(business.category)}</Badge>
              <Badge variant="gray">{business.business_type}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
          <MapPin className="h-3.5 w-3.5" />
          {formatDistance(distance_km)}
        </div>
      </div>

      {business.description && (
        <p className="text-sm text-gray-600 line-clamp-2">{business.description}</p>
      )}

      <div className="flex gap-4">
        {listings.length > 0 && (
          <div className="flex-1">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1.5">
              <Package className="h-3 w-3" />Sells
            </div>
            <div className="flex flex-wrap gap-1">
              {listings.slice(0, 3).map((l) => (
                <span key={l.id} className="text-xs bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-700">
                  {l.product_name}
                </span>
              ))}
              {listings.length > 3 && <span className="text-xs text-gray-400">+{listings.length - 3}</span>}
            </div>
          </div>
        )}
        {needs.length > 0 && (
          <div className="flex-1">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1.5">
              <ShoppingCart className="h-3 w-3" />Needs
            </div>
            <div className="flex flex-wrap gap-1">
              {needs.slice(0, 3).map((n) => (
                <span key={n.id} className="text-xs bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 text-amber-800">
                  {n.product_name}
                </span>
              ))}
              {needs.length > 3 && <span className="text-xs text-gray-400">+{needs.length - 3}</span>}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">{[business.city, business.postcode].filter(Boolean).join(', ')}</p>

      {done ? (
        <div className="flex items-center gap-1.5 text-sm text-teal-700 font-medium">
          <CheckCircle className="h-4 w-4" />Request sent
        </div>
      ) : showMessage ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a short message (optional)"
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSendRequest} loading={connecting}>Send request</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowMessage(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowMessage(true)}>Connect</Button>
      )}
    </div>
  )
}

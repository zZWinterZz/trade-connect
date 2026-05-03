'use client'

import { useState } from 'react'
import { updateConnectionStatus } from '@/app/actions/connections'
import type { Business } from '@/types'
import { formatCategory, formatDate } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Link2, Mail, Phone, Clock, CheckCircle, XCircle, Building2 } from 'lucide-react'

type ConnStatus = 'pending' | 'accepted' | 'declined'

type EnrichedConnection = {
  id: string
  created_at: string
  requester_id: string
  recipient_id: string
  status: ConnStatus
  message: string | null
  requester: Partial<Business>
  recipient: Partial<Business>
}

interface Props {
  myBusiness: Business
  initialConnections: EnrichedConnection[]
}

type Tab = 'pending' | 'active' | 'sent'

export default function ConnectionsManager({ myBusiness, initialConnections }: Props) {
  const [connections, setConnections] = useState<EnrichedConnection[]>(initialConnections)
  const [tab, setTab] = useState<Tab>('pending')
  const [acting, setActing] = useState<string | null>(null)

  const incoming = connections.filter((c) => c.status === 'pending' && c.recipient_id === myBusiness.id)
  const active = connections.filter((c) => c.status === 'accepted')
  const sent = connections.filter((c) => c.status === 'pending' && c.requester_id === myBusiness.id)

  async function handleStatus(id: string, status: 'accepted' | 'declined') {
    setActing(id)
    try {
      const res = await updateConnectionStatus(id, status)
      if ('data' in res) {
        setConnections((prev) => prev.map((c) => c.id === id ? { ...c, status } : c))
      }
    } finally {
      setActing(null)
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'pending', label: 'Requests', count: incoming.length },
    { key: 'active', label: 'Active', count: active.length },
    { key: 'sent', label: 'Sent', count: sent.length },
  ]

  const tabData = tab === 'pending' ? incoming : tab === 'active' ? active : sent

  function getOther(conn: EnrichedConnection): Partial<Business> {
    return conn.requester_id === myBusiness.id ? conn.recipient : conn.requester
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex border-b border-gray-200">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-teal-700 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab === key ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tabData.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Link2 className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {tab === 'pending' ? 'No pending requests' : tab === 'active' ? 'No active connections yet' : 'No sent requests'}
          </p>
          {tab === 'active' && <p className="text-xs text-gray-400 mt-1">Connect with matches to start trading</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {tabData.map((conn) => {
            const other = getOther(conn)
            const isIncoming = conn.recipient_id === myBusiness.id
            return (
              <div key={conn.id} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700 font-semibold text-sm shrink-0">
                      {other.name?.charAt(0) ?? '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-gray-900">{other.name}</span>
                        {other.verified && <span className="text-xs bg-teal-700 text-white rounded-full px-1.5 py-0.5">Verified</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {other.category && <Badge variant="teal">{formatCategory(other.category as Parameters<typeof formatCategory>[0])}</Badge>}
                        {other.city && <span className="text-xs text-gray-400">{other.city}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{formatDate(conn.created_at)}</p>
                    {isIncoming && tab === 'pending' && <span className="text-xs text-amber-600 font-medium">Incoming</span>}
                  </div>
                </div>

                {conn.message && (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700 italic">
                    &ldquo;{conn.message}&rdquo;
                  </div>
                )}

                {conn.status === 'accepted' && (
                  <div className="rounded-lg border border-teal-100 bg-teal-50 p-3 space-y-1.5">
                    <p className="text-xs font-medium text-teal-800 mb-2">Contact details</p>
                    {other.contact_name && (
                      <div className="flex items-center gap-2 text-xs text-teal-900">
                        <Building2 className="h-3 w-3 shrink-0" />{other.contact_name}
                      </div>
                    )}
                    {other.contact_email && (
                      <div className="flex items-center gap-2 text-xs text-teal-900">
                        <Mail className="h-3 w-3 shrink-0" />
                        <a href={`mailto:${other.contact_email}`} className="hover:underline">{other.contact_email}</a>
                      </div>
                    )}
                    {other.contact_phone && (
                      <div className="flex items-center gap-2 text-xs text-teal-900">
                        <Phone className="h-3 w-3 shrink-0" />
                        <a href={`tel:${other.contact_phone}`} className="hover:underline">{other.contact_phone}</a>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'pending' && isIncoming && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleStatus(conn.id, 'accepted')} loading={acting === conn.id}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />Accept
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleStatus(conn.id, 'declined')} disabled={acting === conn.id}>
                      <XCircle className="h-3.5 w-3.5 mr-1" />Decline
                    </Button>
                  </div>
                )}

                {tab === 'sent' && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />Awaiting response
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

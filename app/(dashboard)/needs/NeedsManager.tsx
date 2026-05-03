'use client'

import { useState } from 'react'
import { createNeed, updateNeed, deleteNeed } from '@/app/actions/needs'
import type { Business, Need, Frequency, Urgency } from '@/types'
import { FREE_TIER_LIMITS } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'
import { Plus, Pencil, Trash2, ShoppingCart } from 'lucide-react'

interface Props { business: Business; initialNeeds: Need[] }

const urgencyVariant: Record<Urgency, 'red' | 'amber' | 'blue'> = { high: 'red', medium: 'amber', low: 'blue' }

const emptyForm = (): Partial<Need> => ({
  product_name: '', description: '', frequency: 'weekly', quantity: undefined, unit: '', urgency: 'medium',
})

export default function NeedsManager({ business, initialNeeds }: Props) {
  const [needs, setNeeds] = useState<Need[]>(initialNeeds)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isFree = business.subscription_tier === 'free'
  const atLimit = isFree && needs.length >= FREE_TIER_LIMITS.needs

  function openEdit(n: Need) { setEditId(n.id); setForm({ ...n }); setShowForm(true); setError('') }
  function openNew() { setEditId(null); setForm(emptyForm()); setShowForm(true); setError('') }
  function cancel() { setShowForm(false); setEditId(null); setForm(emptyForm()); setError('') }

  async function save() {
    if (!form.product_name?.trim()) { setError('Product name is required'); return }
    setLoading(true); setError('')
    try {
      const payload = {
        product_name: form.product_name!,
        description: form.description || undefined,
        frequency: (form.frequency ?? 'weekly') as Frequency,
        quantity: form.quantity ?? undefined,
        unit: form.unit || undefined,
        urgency: (form.urgency ?? 'medium') as Urgency,
      }
      if (editId) {
        const res = await updateNeed(editId, payload)
        if ('error' in res) throw new Error(res.error)
        setNeeds((prev) => prev.map((n) => n.id === editId ? res.data as unknown as Need : n))
      } else {
        const res = await createNeed(payload)
        if ('error' in res) throw new Error(res.error)
        setNeeds((prev) => [res.data as unknown as Need, ...prev])
      }
      cancel()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this need?')) return
    await deleteNeed(id)
    setNeeds((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {needs.length} need{needs.length !== 1 ? 's' : ''}
          {isFree && <span className="ml-1 text-xs text-amber-600">· Free tier: {FREE_TIER_LIMITS.needs} max</span>}
        </p>
        {!showForm && (atLimit
          ? <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">Upgrade to Pro for unlimited needs</div>
          : <Button size="sm" onClick={openNew}><Plus className="h-3.5 w-3.5 mr-1" />Add need</Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-teal-200 bg-white p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">{editId ? 'Edit need' : 'New need'}</h3>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <Input label="What do you need?" value={form.product_name || ''} onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))} required placeholder="e.g. Table linen hire" />
          <Textarea label="Description" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Specifications, volume, any notes" />
          <div className="grid grid-cols-3 gap-3">
            <Select label="Frequency" value={form.frequency || 'weekly'} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as Frequency }))} options={[{ label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }, { label: 'Monthly', value: 'monthly' }, { label: 'One-off', value: 'one-off' }]} />
            <Input label="Quantity" type="number" min="1" value={form.quantity ?? ''} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="10" />
            <Input label="Unit" value={form.unit || ''} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="kg / loads" />
          </div>
          <Select label="Urgency" value={form.urgency || 'medium'} onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value as Urgency }))} options={[{ label: 'Low — no rush', value: 'low' }, { label: 'Medium — within weeks', value: 'medium' }, { label: 'High — urgent', value: 'high' }]} />
          <div className="flex gap-2 pt-1">
            <Button onClick={save} loading={loading}>{editId ? 'Save changes' : 'Add need'}</Button>
            <Button variant="ghost" onClick={cancel}>Cancel</Button>
          </div>
        </div>
      )}

      {needs.length === 0 && !showForm ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <ShoppingCart className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No needs listed yet</p>
          <p className="text-xs text-gray-400 mt-1">Add what you want to source to improve your matches</p>
        </div>
      ) : (
        <div className="space-y-2">
          {needs.map((need) => (
            <div key={need.id} className="rounded-xl border border-gray-200 bg-white p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-900">{need.product_name}</span>
                  <Badge variant={urgencyVariant[need.urgency]}>{need.urgency} urgency</Badge>
                  <Badge variant="gray" className="capitalize">{need.frequency}</Badge>
                </div>
                {need.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{need.description}</p>}
                {(need.quantity || need.unit) && (
                  <p className="text-xs text-gray-400 mt-1">Qty: {need.quantity ?? '—'} {need.unit || ''}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(need)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(need.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

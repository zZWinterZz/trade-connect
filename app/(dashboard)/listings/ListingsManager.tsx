'use client'

import { useState } from 'react'
import { createListing, updateListing, deleteListing, toggleListingStock } from '@/app/actions/listings'
import type { Business, Listing, BusinessCategory } from '@/types'
import { CATEGORIES, FREE_TIER_LIMITS } from '@/types'
import { formatCategory } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Package } from 'lucide-react'

const categoryOptions = CATEGORIES.map((c) => ({ label: formatCategory(c), value: c }))

interface Props { business: Business; initialListings: Listing[] }

const emptyForm = (): Partial<Listing> => ({
  product_name: '', description: '', unit: '', price_from: undefined,
  min_order_qty: undefined, lead_time_days: undefined,
  category: 'food & beverage', in_stock: true,
})

export default function ListingsManager({ business, initialListings }: Props) {
  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isFree = business.subscription_tier === 'free'
  const atLimit = isFree && listings.length >= FREE_TIER_LIMITS.listings

  function openEdit(l: Listing) { setEditId(l.id); setForm({ ...l }); setShowForm(true); setError('') }
  function openNew() { setEditId(null); setForm(emptyForm()); setShowForm(true); setError('') }
  function cancel() { setShowForm(false); setEditId(null); setForm(emptyForm()); setError('') }

  async function save() {
    if (!form.product_name?.trim()) { setError('Product name is required'); return }
    setLoading(true); setError('')
    try {
      const payload = {
        product_name: form.product_name!,
        description: form.description || undefined,
        unit: form.unit || undefined,
        price_from: form.price_from ?? undefined,
        min_order_qty: form.min_order_qty ?? undefined,
        lead_time_days: form.lead_time_days ?? undefined,
        category: (form.category ?? 'food & beverage') as BusinessCategory,
        in_stock: form.in_stock ?? true,
      }
      if (editId) {
        const res = await updateListing(editId, payload)
        if ('error' in res) throw new Error(res.error)
        setListings((prev) => prev.map((l) => l.id === editId ? res.data as unknown as Listing : l))
      } else {
        const res = await createListing(payload)
        if ('error' in res) throw new Error(res.error)
        setListings((prev) => [res.data as unknown as Listing, ...prev])
      }
      cancel()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this listing?')) return
    await deleteListing(id)
    setListings((prev) => prev.filter((l) => l.id !== id))
  }

  async function handleToggle(listing: Listing) {
    const res = await toggleListingStock(listing.id, !listing.in_stock)
    if ('data' in res) setListings((prev) => prev.map((l) => l.id === listing.id ? res.data as unknown as Listing : l))
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {listings.length} listing{listings.length !== 1 ? 's' : ''}
          {isFree && <span className="ml-1 text-xs text-amber-600">· Free tier: {FREE_TIER_LIMITS.listings} max</span>}
        </p>
        {!showForm && (atLimit
          ? <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">Upgrade to Pro for unlimited listings</div>
          : <Button size="sm" onClick={openNew}><Plus className="h-3.5 w-3.5 mr-1" />Add listing</Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-teal-200 bg-white p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">{editId ? 'Edit listing' : 'New listing'}</h3>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <Input label="Product / service name" value={form.product_name || ''} onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))} required placeholder="e.g. Fresh sourdough bread" />
          <Textarea label="Description" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Product details, specifications, etc." />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category || 'food & beverage'} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as BusinessCategory }))} options={categoryOptions} />
            <Input label="Unit" value={form.unit || ''} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="kg / case / each" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Price from (£)" type="number" min="0" step="0.01" value={form.price_from ?? ''} onChange={(e) => setForm((f) => ({ ...f, price_from: e.target.value ? parseFloat(e.target.value) : undefined }))} placeholder="0.00" />
            <Input label="Min. order qty" type="number" min="1" value={form.min_order_qty ?? ''} onChange={(e) => setForm((f) => ({ ...f, min_order_qty: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="1" />
            <Input label="Lead time (days)" type="number" min="0" value={form.lead_time_days ?? ''} onChange={(e) => setForm((f) => ({ ...f, lead_time_days: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="0" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.in_stock ?? true} onChange={(e) => setForm((f) => ({ ...f, in_stock: e.target.checked }))} className="rounded border-gray-300 text-teal-600" />
            Currently in stock
          </label>
          <div className="flex gap-2 pt-1">
            <Button onClick={save} loading={loading}>{editId ? 'Save changes' : 'Add listing'}</Button>
            <Button variant="ghost" onClick={cancel}>Cancel</Button>
          </div>
        </div>
      )}

      {listings.length === 0 && !showForm ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Package className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No listings yet</p>
          <p className="text-xs text-gray-400 mt-1">Add products or services you supply to get matched</p>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-xl border border-gray-200 bg-white p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-900">{listing.product_name}</span>
                  <Badge variant={listing.in_stock ? 'green' : 'gray'}>{listing.in_stock ? 'In stock' : 'Out of stock'}</Badge>
                  <Badge variant="teal">{formatCategory(listing.category)}</Badge>
                </div>
                {listing.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{listing.description}</p>}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  {listing.unit && <span>Unit: {listing.unit}</span>}
                  {listing.price_from != null && <span>From £{listing.price_from}</span>}
                  {listing.lead_time_days != null && <span>Lead time: {listing.lead_time_days}d</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleToggle(listing)} title="Toggle stock" className="p-1.5 rounded-lg text-gray-400 hover:text-teal-700 hover:bg-teal-50 transition-colors">
                  {listing.in_stock ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(listing)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(listing.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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

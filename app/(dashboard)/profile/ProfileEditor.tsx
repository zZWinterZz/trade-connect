'use client'

import { useState } from 'react'
import { updateProfile } from '@/app/actions/profile'
import type { Business, BusinessCategory, BusinessType } from '@/types'
import { CATEGORIES } from '@/types'
import { formatCategory } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'
import { MapPin, Star, CheckCircle } from 'lucide-react'

interface Props { business: Business; userEmail: string }

const categoryOptions = CATEGORIES.map((c) => ({ label: formatCategory(c), value: c }))

async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return { lat: 51.505 + (Math.random() - 0.5) * 0.3, lng: -0.09 + (Math.random() - 0.5) * 0.3 }
    }
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(postcode + ', UK')}&key=${apiKey}`
    )
    const data = await res.json()
    if (data.results?.[0]?.geometry?.location) return data.results[0].geometry.location
  } catch {}
  return null
}

export default function ProfileEditor({ business: initialBusiness, userEmail }: Props) {
  const [business, setBusiness] = useState(initialBusiness)
  const [form, setForm] = useState({ ...initialBusiness })
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleGeocode(postcode: string) {
    setGeocoding(true)
    const coords = await geocodePostcode(postcode)
    if (coords) setForm((f) => ({ ...f, lat: coords.lat, lng: coords.lng }))
    setGeocoding(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess(false)
    try {
      // Re-geocode if postcode changed
      let lat = form.lat
      let lng = form.lng
      if (form.postcode !== business.postcode && form.postcode) {
        const coords = await geocodePostcode(form.postcode)
        if (coords) { lat = coords.lat; lng = coords.lng }
      }

      const res = await updateProfile({
        name: form.name,
        description: form.description || undefined,
        website: form.website || undefined,
        business_type: form.business_type,
        category: form.category,
        address: form.address || undefined,
        city: form.city || undefined,
        postcode: form.postcode || undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        contact_name: form.contact_name || undefined,
        contact_email: form.contact_email || undefined,
        contact_phone: form.contact_phone || undefined,
      })

      if ('error' in res) throw new Error(res.error)
      const updated = res.data as unknown as Business
      setBusiness(updated)
      setForm(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className={`rounded-xl border p-4 flex items-center justify-between ${business.subscription_tier === 'pro' ? 'border-teal-200 bg-teal-50' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center gap-2">
          {business.verified && <Star className="h-4 w-4 fill-teal-600 text-teal-600" />}
          <span className="text-sm font-medium text-gray-900">{business.subscription_tier === 'pro' ? 'Pro plan' : 'Free plan'}</span>
          {business.verified && <Badge variant="teal">Verified</Badge>}
        </div>
        {business.subscription_tier === 'free' && (
          <button className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 transition-colors">
            Upgrade to Pro — £49/mo
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Business details</h2>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />Profile saved successfully
          </div>
        )}

        <Input label="Business name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        <Textarea label="Description" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Tell potential partners about your business" hint="Shown on your match card" />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Business type" value={form.business_type} onChange={(e) => setForm((f) => ({ ...f, business_type: e.target.value as BusinessType }))} options={[{ label: 'Supplier', value: 'supplier' }, { label: 'Buyer', value: 'buyer' }, { label: 'Both', value: 'both' }]} />
          <Select label="Primary category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as BusinessCategory }))} options={categoryOptions} />
        </div>
        <Input label="Website" type="url" value={form.website || ''} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://yoursite.com" />

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />Location
          </h3>
          <div className="space-y-3">
            <Input label="Street address" value={form.address || ''} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" value={form.city || ''} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              <div>
                <Input label="Postcode" value={form.postcode || ''} onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))} hint="Used for proximity matching" />
                {form.postcode && form.postcode !== business.postcode && (
                  <button type="button" onClick={() => handleGeocode(form.postcode!)} disabled={geocoding} className="mt-1 text-xs text-teal-700 hover:underline disabled:opacity-50">
                    {geocoding ? 'Geocoding...' : 'Update location from postcode'}
                  </button>
                )}
              </div>
            </div>
            {form.lat && form.lng && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-teal-600" />
                Location set: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Contact details</h3>
          <div className="space-y-3">
            <Input label="Contact name" value={form.contact_name || ''} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Contact email" type="email" value={form.contact_email || ''} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} hint="Shared with accepted connections" />
              <Input label="Phone" type="tel" value={form.contact_phone || ''} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} hint="Optional" />
            </div>
          </div>
        </div>

        <Button type="submit" loading={loading} size="lg">Save profile</Button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Account</h2>
        <p className="text-sm text-gray-600">Signed in as <span className="font-medium text-gray-900">{userEmail}</span></p>
      </div>
    </div>
  )
}

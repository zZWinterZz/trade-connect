'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Check } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { createBusiness } from '@/app/actions/business'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { CATEGORIES, type BusinessCategory, type BusinessType } from '@/types'
import { cn } from '@/lib/utils'

const STEPS = ['Account', 'Business', 'What you sell', 'What you need']

type AccountData = { email: string; password: string; confirm: string }
type BusinessData = {
  name: string; description: string; website: string
  business_type: BusinessType; category: BusinessCategory
  address: string; city: string; postcode: string
  contact_name: string; contact_email: string; contact_phone: string
}
type ListingData = { product_name: string; description: string; unit: string; price_from: string; category: BusinessCategory; in_stock: boolean }
type NeedData = { product_name: string; description: string; frequency: string; quantity: string; unit: string; urgency: string }

const categoryOptions = CATEGORIES.map((c) => ({
  label: c.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  value: c,
}))

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
    if (data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location
    }
  } catch {}
  return null
}

export default function RegisterPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const [account, setAccount] = useState<AccountData>({ email: '', password: '', confirm: '' })
  const [business, setBusiness] = useState<BusinessData>({
    name: '', description: '', website: '', business_type: 'both', category: 'food & beverage',
    address: '', city: '', postcode: '', contact_name: '', contact_email: '', contact_phone: '',
  })
  const [listing, setListing] = useState<ListingData>({ product_name: '', description: '', unit: '', price_from: '', category: 'food & beverage', in_stock: true })
  const [need, setNeed] = useState<NeedData>({ product_name: '', description: '', frequency: 'weekly', quantity: '', unit: '', urgency: 'medium' })
  const [addListing, setAddListing] = useState(false)
  const [addNeed, setAddNeed] = useState(false)

  function handleStep0(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (account.password !== account.confirm) { setError('Passwords do not match'); return }
    if (account.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setStep(1)
  }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!business.name.trim()) { setError('Business name is required'); return }
    setStep(2)
  }

  async function handleFinalStep(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1. Create auth user
      const { error: authErr } = await authClient.signUp.email({
        email: account.email,
        password: account.password,
        name: business.contact_name || business.name,
      })
      if (authErr) throw new Error(authErr.message)

      // 2. Geocode postcode
      const coords = business.postcode ? await geocodePostcode(business.postcode) : null

      // 3. Create business (+ optional listing/need) via server action
      const result = await createBusiness(
        {
          name: business.name,
          description: business.description || undefined,
          website: business.website || undefined,
          business_type: business.business_type,
          category: business.category,
          address: business.address || undefined,
          city: business.city || undefined,
          postcode: business.postcode || undefined,
          lat: coords?.lat,
          lng: coords?.lng,
          contact_name: business.contact_name || undefined,
          contact_email: business.contact_email || account.email,
          contact_phone: business.contact_phone || undefined,
        },
        addListing && listing.product_name ? {
          product_name: listing.product_name,
          description: listing.description || undefined,
          unit: listing.unit || undefined,
          price_from: listing.price_from ? parseFloat(listing.price_from) : undefined,
          category: listing.category,
          in_stock: listing.in_stock,
        } : undefined,
        addNeed && need.product_name ? {
          product_name: need.product_name,
          description: need.description || undefined,
          frequency: need.frequency,
          quantity: need.quantity ? parseInt(need.quantity) : undefined,
          unit: need.unit || undefined,
          urgency: need.urgency,
        } : undefined,
      )

      if ('error' in result) throw new Error(String(result.error))

      router.push('/dashboard')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-teal-700" strokeWidth={2} />
            <span className="font-bold text-gray-900">TradeConnect</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Register your business</h1>
          <p className="text-sm text-gray-500 mt-1">It takes about 3 minutes</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  i < step ? 'bg-teal-700 text-white' :
                  i === step ? 'bg-teal-700 text-white ring-4 ring-teal-100' :
                  'bg-gray-200 text-gray-500'
                )}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn('text-xs mt-1 text-center whitespace-nowrap', i === step ? 'text-teal-700 font-medium' : 'text-gray-400')}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-2 mb-4 transition-colors', i < step ? 'bg-teal-700' : 'bg-gray-200')} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          {step === 0 && (
            <form onSubmit={handleStep0} className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Create your account</h2>
              <Input label="Email address" type="email" value={account.email} onChange={(e) => setAccount(a => ({ ...a, email: e.target.value }))} required placeholder="you@company.com" />
              <Input label="Password" type="password" value={account.password} onChange={(e) => setAccount(a => ({ ...a, password: e.target.value }))} required placeholder="Min. 8 characters" hint="At least 8 characters" />
              <Input label="Confirm password" type="password" value={account.confirm} onChange={(e) => setAccount(a => ({ ...a, confirm: e.target.value }))} required placeholder="Repeat password" />
              <Button type="submit" className="w-full mt-2" size="lg">Continue</Button>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Business profile</h2>
              <Input label="Business name" value={business.name} onChange={(e) => setBusiness(b => ({ ...b, name: e.target.value }))} required placeholder="Acme Supplies Ltd" />
              <Textarea label="Description" value={business.description} onChange={(e) => setBusiness(b => ({ ...b, description: e.target.value }))} placeholder="Brief overview of your business" hint="Optional — shown to potential matches" />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Business type" value={business.business_type} onChange={(e) => setBusiness(b => ({ ...b, business_type: e.target.value as BusinessType }))} options={[{ label: 'Supplier', value: 'supplier' }, { label: 'Buyer', value: 'buyer' }, { label: 'Both', value: 'both' }]} />
                <Select label="Category" value={business.category} onChange={(e) => setBusiness(b => ({ ...b, category: e.target.value as BusinessCategory }))} options={categoryOptions} />
              </div>
              <Input label="Street address" value={business.address} onChange={(e) => setBusiness(b => ({ ...b, address: e.target.value }))} placeholder="123 High Street" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="City" value={business.city} onChange={(e) => setBusiness(b => ({ ...b, city: e.target.value }))} placeholder="London" />
                <Input label="Postcode" value={business.postcode} onChange={(e) => setBusiness(b => ({ ...b, postcode: e.target.value }))} placeholder="EC1A 1BB" hint="Used for proximity matching" />
              </div>
              <Input label="Contact name" value={business.contact_name} onChange={(e) => setBusiness(b => ({ ...b, contact_name: e.target.value }))} placeholder="Jane Smith" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Contact email" type="email" value={business.contact_email} onChange={(e) => setBusiness(b => ({ ...b, contact_email: e.target.value }))} placeholder="jane@company.com" />
                <Input label="Phone" type="tel" value={business.contact_phone} onChange={(e) => setBusiness(b => ({ ...b, contact_phone: e.target.value }))} placeholder="020 1234 5678" />
              </div>
              <Input label="Website" type="url" value={business.website} onChange={(e) => setBusiness(b => ({ ...b, website: e.target.value }))} placeholder="https://yoursite.com" />
              <div className="flex gap-3 mt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button type="submit" className="flex-1" size="lg">Continue</Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(3) }} className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-1">What do you sell? <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
              <p className="text-sm text-gray-500 mb-4">Add a product or service you supply. You can add more later.</p>
              {!addListing ? (
                <button type="button" onClick={() => setAddListing(true)} className="w-full rounded-xl border-2 border-dashed border-gray-200 py-6 text-sm text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-colors">
                  + Add a listing
                </button>
              ) : (
                <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <Input label="Product / service name" value={listing.product_name} onChange={(e) => setListing(l => ({ ...l, product_name: e.target.value }))} placeholder="e.g. Fresh sourdough bread" />
                  <Textarea label="Description" value={listing.description} onChange={(e) => setListing(l => ({ ...l, description: e.target.value }))} placeholder="Details about the product" />
                  <div className="grid grid-cols-3 gap-3">
                    <Select label="Category" value={listing.category} onChange={(e) => setListing(l => ({ ...l, category: e.target.value as BusinessCategory }))} options={categoryOptions} />
                    <Input label="Unit" value={listing.unit} onChange={(e) => setListing(l => ({ ...l, unit: e.target.value }))} placeholder="kg / case" />
                    <Input label="Price from (£)" type="number" value={listing.price_from} onChange={(e) => setListing(l => ({ ...l, price_from: e.target.value }))} placeholder="0.00" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={listing.in_stock} onChange={(e) => setListing(l => ({ ...l, in_stock: e.target.checked }))} className="rounded border-gray-300" />
                    Currently in stock
                  </label>
                </div>
              )}
              <div className="flex gap-3 mt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" className="flex-1" size="lg">Continue</Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleFinalStep} className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-1">What do you need to buy? <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
              <p className="text-sm text-gray-500 mb-4">Add something you regularly source. You can add more later.</p>
              {!addNeed ? (
                <button type="button" onClick={() => setAddNeed(true)} className="w-full rounded-xl border-2 border-dashed border-gray-200 py-6 text-sm text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-colors">
                  + Add a need
                </button>
              ) : (
                <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <Input label="Product / service needed" value={need.product_name} onChange={(e) => setNeed(n => ({ ...n, product_name: e.target.value }))} placeholder="e.g. Table linen hire" />
                  <Textarea label="Description" value={need.description} onChange={(e) => setNeed(n => ({ ...n, description: e.target.value }))} placeholder="Any specific requirements" />
                  <div className="grid grid-cols-3 gap-3">
                    <Select label="Frequency" value={need.frequency} onChange={(e) => setNeed(n => ({ ...n, frequency: e.target.value }))} options={[{ label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }, { label: 'Monthly', value: 'monthly' }, { label: 'One-off', value: 'one-off' }]} />
                    <Input label="Quantity" type="number" value={need.quantity} onChange={(e) => setNeed(n => ({ ...n, quantity: e.target.value }))} placeholder="10" />
                    <Select label="Urgency" value={need.urgency} onChange={(e) => setNeed(n => ({ ...n, urgency: e.target.value }))} options={[{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }]} />
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button type="submit" loading={loading} className="flex-1" size="lg">Complete registration</Button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-teal-700 hover:text-teal-800">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

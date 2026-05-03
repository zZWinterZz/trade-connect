export type BusinessType = 'supplier' | 'buyer' | 'both'

export type BusinessCategory =
  | 'food & beverage'
  | 'linen & laundry'
  | 'cleaning supplies'
  | 'maintenance'
  | 'logistics'
  | 'other'

export type SubscriptionTier = 'free' | 'pro'

export type ConnectionStatus = 'pending' | 'accepted' | 'declined'

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'one-off'

export type Urgency = 'low' | 'medium' | 'high'

export interface Business {
  id: string
  created_at: string
  name: string
  description: string | null
  website: string | null
  business_type: BusinessType
  category: BusinessCategory
  address: string | null
  city: string | null
  postcode: string | null
  country: string
  lat: number | null
  lng: number | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  subscription_tier: SubscriptionTier
  verified: boolean
  owner_id: string
}

export interface Listing {
  id: string
  business_id: string
  created_at: string
  product_name: string
  description: string | null
  unit: string | null
  price_from: number | null
  min_order_qty: number | null
  lead_time_days: number | null
  in_stock: boolean
  category: BusinessCategory
}

export interface Need {
  id: string
  business_id: string
  created_at: string
  product_name: string
  description: string | null
  frequency: Frequency
  quantity: number | null
  unit: string | null
  urgency: Urgency
}

export interface Connection {
  id: string
  created_at: string
  requester_id: string
  recipient_id: string
  status: ConnectionStatus
  message: string | null
  requester?: Business
  recipient?: Business
}

export interface MatchResult {
  business: Business
  listings: Listing[]
  needs: Need[]
  distance_km: number
  category_overlap_score: number
  proximity_score: number
  total_score: number
}

export const CATEGORIES: BusinessCategory[] = [
  'food & beverage',
  'linen & laundry',
  'cleaning supplies',
  'maintenance',
  'logistics',
  'other',
]

export const DISTANCE_OPTIONS = [
  { label: '5 miles', value: 8 },
  { label: '10 miles', value: 16 },
  { label: '25 miles', value: 40 },
  { label: '50 miles', value: 80 },
]

export const FREE_TIER_LIMITS = {
  listings: 1,
  needs: 1,
  matches: 5,
  connections_per_month: 3,
}

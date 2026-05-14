'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { businesses, listings } from '@/lib/db/schema'
import { eq, and, isNotNull } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import type { BusinessCategory } from '@/types'
import { CATEGORIES } from '@/types'

export async function regenerateSyncToken() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const biz = await db.query.businesses.findFirst({
    where: eq(businesses.owner_id, session.user.id),
  })
  if (!biz) return { error: 'No business found' }

  const newToken = randomBytes(24).toString('hex')
  await db
    .update(businesses)
    .set({ sync_token: newToken })
    .where(eq(businesses.id, biz.id))

  revalidatePath('/integrations')
  return { success: true, token: newToken }
}

// ── CSV import ────────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ''))
  return lines.slice(1).filter(Boolean).map((line) => {
    // Handle quoted fields
    const values: string[] = []
    let cur = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes }
      else if (ch === ',' && !inQuotes) { values.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    values.push(cur.trim())

    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

export async function importFromCSV(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const biz = await db.query.businesses.findFirst({
    where: eq(businesses.owner_id, session.user.id),
  })
  if (!biz) return { error: 'No business found' }

  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }
  if (!file.name.endsWith('.csv')) return { error: 'File must be a .csv' }

  const text = await file.text()
  const rows = parseCSV(text)
  if (!rows.length) return { error: 'CSV is empty or has no data rows' }

  const mode = (formData.get('mode') as string) ?? 'upsert'

  if (mode === 'replace') {
    await db.delete(listings).where(
      and(eq(listings.business_id, biz.id), isNotNull(listings.external_id))
    )
  }

  let created = 0
  let updated = 0
  const errors: string[] = []

  for (const row of rows) {
    const productName = row['product_name'] || row['productname'] || row['name']
    if (!productName) { errors.push('Row skipped: missing product_name'); continue }

    const rawCategory = (row['category'] ?? '').toLowerCase().trim()
    const category: BusinessCategory = (CATEGORIES as readonly string[]).includes(rawCategory)
      ? rawCategory as BusinessCategory
      : 'other'

    const values = {
      business_id: biz.id,
      product_name: productName,
      description: row['description'] || null,
      category,
      price_from: row['price_from'] ? parseFloat(row['price_from']) : null,
      unit: row['unit'] || null,
      in_stock: row['in_stock'] !== 'false' && row['in_stock'] !== '0',
      min_order_qty: row['min_order_qty'] ? parseInt(row['min_order_qty']) : null,
      lead_time_days: row['lead_time_days'] ? parseInt(row['lead_time_days']) : null,
      external_id: row['external_id'] || row['sku'] || row['id'] || null,
    }

    if (values.external_id && mode !== 'replace') {
      const existing = await db.query.listings.findFirst({
        where: and(
          eq(listings.business_id, biz.id),
          eq(listings.external_id, values.external_id)
        ),
      })
      if (existing) {
        await db.update(listings).set(values).where(eq(listings.id, existing.id))
        updated++
        continue
      }
    }

    await db.insert(listings).values(values)
    created++
  }

  await db
    .update(businesses)
    .set({ last_synced_at: new Date().toISOString() })
    .where(eq(businesses.id, biz.id))

  revalidatePath('/listings')
  revalidatePath('/integrations')
  return { success: true, created, updated, errors }
}

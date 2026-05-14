import { db } from '@/lib/db'
import { businesses, listings } from '@/lib/db/schema'
import { eq, and, isNotNull } from 'drizzle-orm'
import { CATEGORIES } from '@/types'
import type { BusinessCategory } from '@/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const biz = await db.query.businesses.findFirst({
    where: eq(businesses.sync_token, token),
  })
  if (!biz) {
    return Response.json({ error: 'Invalid sync token' }, { status: 401 })
  }

  let body: { listings?: unknown[]; mode?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const items = Array.isArray(body.listings) ? body.listings : []
  const mode = body.mode === 'replace' ? 'replace' : 'upsert'

  if (mode === 'replace') {
    await db.delete(listings).where(
      and(eq(listings.business_id, biz.id), isNotNull(listings.external_id))
    )
  }

  let created = 0
  let updated = 0
  const errors: string[] = []

  for (const raw of items) {
    const item = raw as Record<string, unknown>
    const productName = String(item['product_name'] ?? '').trim()
    if (!productName) { errors.push('Skipped: missing product_name'); continue }

    const rawCategory = String(item['category'] ?? '').toLowerCase().trim()
    const category: BusinessCategory = (CATEGORIES as readonly string[]).includes(rawCategory)
      ? rawCategory as BusinessCategory
      : 'other'

    const values = {
      business_id: biz.id,
      product_name: productName,
      description: item['description'] != null ? String(item['description']) : null,
      category,
      price_from: item['price_from'] != null ? parseFloat(String(item['price_from'])) : null,
      unit: item['unit'] != null ? String(item['unit']) : null,
      in_stock: item['in_stock'] !== false && item['in_stock'] !== 'false' && item['in_stock'] !== 0,
      min_order_qty: item['min_order_qty'] != null ? parseInt(String(item['min_order_qty'])) : null,
      lead_time_days: item['lead_time_days'] != null ? parseInt(String(item['lead_time_days'])) : null,
      external_id: item['external_id'] != null ? String(item['external_id']) : null,
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

  return Response.json({ success: true, created, updated, errors })
}

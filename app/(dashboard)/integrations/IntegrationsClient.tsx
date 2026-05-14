'use client'

import { useState, useRef, useTransition } from 'react'
import { Copy, Check, RefreshCw, Upload, Zap, FileText, Code } from 'lucide-react'
import { regenerateSyncToken, importFromCSV } from '@/app/actions/integrations'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Props {
  businessId: string
  syncToken: string | null
  lastSyncedAt: string | null
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="ml-2 rounded p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Copy">
      {copied ? <Check className="h-3.5 w-3.5 text-teal-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export default function IntegrationsClient({ syncToken: initialToken, lastSyncedAt }: Props) {
  const [token, setToken] = useState(initialToken)
  const [isPending, startTransition] = useTransition()
  const [csvStatus, setCsvStatus] = useState<{ success?: boolean; message?: string } | null>(null)
  const [importMode, setImportMode] = useState<'upsert' | 'replace'>('upsert')
  const fileRef = useRef<HTMLInputElement>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const webhookUrl = token ? `${baseUrl}/api/sync/${token}` : '—'

  function handleRegenerate() {
    if (!confirm('Regenerate sync token? Your existing integrations will need to be updated with the new URL.')) return
    startTransition(async () => {
      const result = await regenerateSyncToken()
      if (result.success && result.token) setToken(result.token)
    })
  }

  async function handleCSVUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('mode', importMode)
    setCsvStatus(null)
    const result = await importFromCSV(fd)
    if ('error' in result) {
      setCsvStatus({ success: false, message: result.error })
    } else {
      setCsvStatus({
        success: true,
        message: `Imported: ${result.created} created, ${result.updated} updated${result.errors?.length ? ` (${result.errors.length} skipped)` : ''}`,
      })
      form.reset()
    }
  }

  const curlExample = token
    ? `curl -X POST ${baseUrl}/api/sync/${token} \\
  -H "Content-Type: application/json" \\
  -d '{
  "mode": "upsert",
  "listings": [
    {
      "external_id": "SKU-001",
      "product_name": "Widget A",
      "description": "Our best widget",
      "category": "other",
      "price_from": 9.99,
      "unit": "each",
      "in_stock": true,
      "min_order_qty": 10,
      "lead_time_days": 2
    }
  ]
}'`
    : ''

  const csvExample = `external_id,product_name,description,category,price_from,unit,in_stock,min_order_qty,lead_time_days
SKU-001,Widget A,Our best widget,other,9.99,each,true,10,2
SKU-002,Widget B,,food & beverage,4.50,kg,true,,`

  return (
    <div className="space-y-6">

      {/* Webhook card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-teal-700" />
          <h2 className="font-semibold text-gray-900">Webhook sync</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          POST your product data to this URL from any system — ERP, Shopify, custom scripts, anything.
          Your listings update instantly. The token acts as your secret key; keep it private.
        </p>

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Your webhook URL</label>
          <div className="mt-1.5 flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <code className="text-sm text-gray-800 flex-1 break-all">{webhookUrl}</code>
            {token && <CopyButton text={webhookUrl} />}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {lastSyncedAt
              ? `Last synced: ${new Date(lastSyncedAt).toLocaleString()}`
              : 'Never synced'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            loading={isPending}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Regenerate token
          </Button>
        </div>
      </div>

      {/* CSV import card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-teal-700" />
          <h2 className="font-semibold text-gray-900">CSV import</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Export a spreadsheet from your system and upload it here. Required column: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">product_name</code>.
          Optional: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">external_id</code>, <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">category</code>, <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">price_from</code>, <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">unit</code>, <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">in_stock</code>, <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">description</code>.
        </p>

        <form onSubmit={handleCSVUpload} className="space-y-4">
          <input ref={fileRef} type="file" name="file" accept=".csv" required className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100" />

          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600 font-medium">Mode:</span>
            {(['upsert', 'replace'] as const).map((m) => (
              <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mode" value={m} checked={importMode === m} onChange={() => setImportMode(m)} className="text-teal-600" />
                <span className={cn('text-gray-700', importMode === m && 'font-medium')}>
                  {m === 'upsert' ? 'Upsert (add & update)' : 'Replace (wipe synced listings first)'}
                </span>
              </label>
            ))}
          </div>

          {csvStatus && (
            <div className={cn('rounded-lg px-3 py-2 text-sm', csvStatus.success ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-700')}>
              {csvStatus.message}
            </div>
          )}

          <Button type="submit" size="sm">
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Upload CSV
          </Button>
        </form>

        {/* CSV example */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Example CSV</span>
            <CopyButton text={csvExample} />
          </div>
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto text-gray-700 leading-relaxed">{csvExample}</pre>
        </div>
      </div>

      {/* API reference card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code className="h-4 w-4 text-teal-700" />
          <h2 className="font-semibold text-gray-900">API reference</h2>
        </div>

        <div className="space-y-3 text-sm text-gray-600 mb-4">
          <p><span className="font-medium text-gray-800">Endpoint:</span> <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">POST /api/sync/{'<token>'}</code></p>
          <p><span className="font-medium text-gray-800">Content-Type:</span> <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">application/json</code></p>
          <div>
            <p className="font-medium text-gray-800 mb-1">Modes:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li><code className="text-xs bg-gray-100 px-1 rounded">upsert</code> — create new listings, update existing ones matched by <code className="text-xs bg-gray-100 px-1 rounded">external_id</code></li>
              <li><code className="text-xs bg-gray-100 px-1 rounded">replace</code> — delete all previously synced listings, then insert the new set</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-800 mb-1">Valid categories:</p>
            <p className="text-gray-500 text-xs font-mono">food & beverage · linen & laundry · cleaning supplies · maintenance · logistics · other</p>
          </div>
        </div>

        {token && (
          <>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Example request (curl)</span>
              <CopyButton text={curlExample} />
            </div>
            <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto text-gray-700 leading-relaxed">{curlExample}</pre>
          </>
        )}
      </div>
    </div>
  )
}

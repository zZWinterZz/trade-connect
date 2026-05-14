'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, ShieldCheck } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function TwoFactorPage() {
  const [code, setCode] = useState('')
  const [useBackup, setUseBackup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const client = authClient as typeof authClient & { twoFactor: { verifyTotp: (o: { code: string }) => Promise<{ error?: { message: string } }>; verifyBackupCode: (o: { code: string }) => Promise<{ error?: { message: string } }> } }
      const fn = useBackup ? client.twoFactor.verifyBackupCode : client.twoFactor.verifyTotp
      const { error: err } = await fn({ code })
      if (err) throw new Error(err.message)
      router.push('/dashboard')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-teal-700 mb-6">
            <Building2 className="h-5 w-5" strokeWidth={2} />
            <span className="font-bold text-gray-900">TradeConnect</span>
          </Link>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 mb-3">
            <ShieldCheck className="h-6 w-6 text-teal-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Two-factor auth</h1>
          <p className="text-sm text-gray-500 mt-1">
            {useBackup ? 'Enter a backup code' : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label={useBackup ? 'Backup code' : 'Authenticator code'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder={useBackup ? 'xxxxxxxx-xxxx' : '000000'}
              autoComplete="one-time-code"
              maxLength={useBackup ? 20 : 6}
            />
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <Button type="submit" loading={loading} className="w-full" size="lg">Verify</Button>
          </form>

          <button
            type="button"
            onClick={() => { setUseBackup(!useBackup); setCode(''); setError('') }}
            className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            {useBackup ? 'Use authenticator app instead' : 'Use a backup code instead'}
          </button>
        </div>
      </div>
    </div>
  )
}

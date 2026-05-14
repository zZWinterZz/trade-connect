'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldOff, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface Props {
  twoFactorEnabled: boolean
  userEmail: string
}

type Phase = 'idle' | 'confirming-enable' | 'setup' | 'backup-codes' | 'confirming-disable'

export default function SecurityClient({ twoFactorEnabled: initial, userEmail }: Props) {
  const [enabled, setEnabled] = useState(initial)
  const [phase, setPhase] = useState<Phase>('idle')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [totpUri, setTotpUri] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [copiedBackup, setCopiedBackup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Generate QR code when totpUri changes
  useEffect(() => {
    if (!totpUri) return
    import('qrcode').then(({ toDataURL }) => {
      toDataURL(totpUri, { width: 200, margin: 1 }).then(setQrDataUrl)
    })
  }, [totpUri])

  function reset() {
    setPhase('idle')
    setPassword('')
    setTotpCode('')
    setTotpUri('')
    setQrDataUrl('')
    setBackupCodes([])
    setError('')
  }

  async function handleEnable(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const client = authClient as typeof authClient & {
        twoFactor: {
          enable: (o: { password: string }) => Promise<{ data?: { totpURI?: string; backupCodes?: string[] }; error?: { message: string } }>
        }
      }
      const { data, error: err } = await client.twoFactor.enable({ password })
      if (err) throw new Error(err.message)
      if (data?.totpURI) {
        setTotpUri(data.totpURI)
        setBackupCodes(data.backupCodes ?? [])
        setPhase('setup')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to enable 2FA')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const client = authClient as typeof authClient & {
        twoFactor: { verifyTotp: (o: { code: string }) => Promise<{ error?: { message: string } }> }
      }
      const { error: err } = await client.twoFactor.verifyTotp({ code: totpCode })
      if (err) throw new Error(err.message)
      setEnabled(true)
      setPhase('backup-codes')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const client = authClient as typeof authClient & {
        twoFactor: { disable: (o: { password: string }) => Promise<{ error?: { message: string } }> }
      }
      const { error: err } = await client.twoFactor.disable({ password })
      if (err) throw new Error(err.message)
      setEnabled(false)
      reset()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopiedBackup(true)
    setTimeout(() => setCopiedBackup(false), 2000)
  }

  // ── Idle ──────────────────────────────────────────────────────────────────

  if (phase === 'idle') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {enabled
                ? <ShieldCheck className="h-5 w-5 text-teal-600 mt-0.5" />
                : <ShieldOff className="h-5 w-5 text-gray-400 mt-0.5" />}
              <div>
                <p className="font-semibold text-gray-900">Authenticator app (TOTP)</p>
                <p className="text-sm text-gray-500">
                  {enabled
                    ? 'Two-factor authentication is active. You\'ll need your authenticator app each time you sign in.'
                    : 'Add an extra layer of security. Use Google Authenticator, Authy, or any TOTP app.'}
                </p>
              </div>
            </div>
            <span className={cn(
              'ml-4 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
              enabled ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'
            )}>
              {enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="mt-4 flex gap-2">
            {enabled ? (
              <Button variant="ghost" size="sm" onClick={() => setPhase('confirming-disable')}>
                Disable 2FA
              </Button>
            ) : (
              <Button size="sm" onClick={() => setPhase('confirming-enable')}>
                Enable 2FA
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Confirm password to enable ────────────────────────────────────────────

  if (phase === 'confirming-enable') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 max-w-sm">
        <h2 className="font-semibold text-gray-900 mb-1">Enable two-factor authentication</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your password to continue.</p>
        <form onSubmit={handleEnable} className="space-y-4">
          <div className="relative">
            <Input
              label="Current password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancel</Button>
            <Button type="submit" size="sm" loading={loading}>Continue</Button>
          </div>
        </form>
      </div>
    )
  }

  // ── QR code setup ─────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 max-w-sm">
        <h2 className="font-semibold text-gray-900 mb-1">Scan QR code</h2>
        <p className="text-sm text-gray-500 mb-4">
          Open your authenticator app and scan the code below, then enter the 6-digit code to confirm.
        </p>
        <div className="flex justify-center mb-4">
          {qrDataUrl
            ? <img src={qrDataUrl} alt="TOTP QR code" className="rounded-lg border border-gray-200" width={200} height={200} />
            : <div className="h-[200px] w-[200px] rounded-lg bg-gray-100 animate-pulse" />}
        </div>
        <p className="text-xs text-gray-400 text-center mb-4 break-all">{userEmail}</p>
        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            label="6-digit code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            placeholder="000000"
            autoComplete="one-time-code"
            maxLength={6}
          />
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancel</Button>
            <Button type="submit" size="sm" loading={loading} disabled={totpCode.length < 6}>Verify & enable</Button>
          </div>
        </form>
      </div>
    )
  }

  // ── Backup codes ──────────────────────────────────────────────────────────

  if (phase === 'backup-codes') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 max-w-sm">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-5 w-5 text-teal-600" />
          <h2 className="font-semibold text-gray-900">2FA enabled!</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Save these backup codes somewhere safe. Each can only be used once to sign in if you lose access to your authenticator app.
        </p>
        <div className="grid grid-cols-2 gap-1.5 bg-gray-50 rounded-lg p-3 mb-4 font-mono text-sm">
          {backupCodes.map((code) => (
            <span key={code} className="text-gray-700">{code}</span>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={copyBackupCodes}>
            {copiedBackup ? <Check className="h-3.5 w-3.5 mr-1.5 text-teal-600" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {copiedBackup ? 'Copied!' : 'Copy codes'}
          </Button>
          <Button size="sm" onClick={reset}>Done</Button>
        </div>
      </div>
    )
  }

  // ── Confirm password to disable ───────────────────────────────────────────

  if (phase === 'confirming-disable') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 max-w-sm">
        <h2 className="font-semibold text-gray-900 mb-1">Disable two-factor authentication</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your password to remove 2FA from your account.</p>
        <form onSubmit={handleDisable} className="space-y-4">
          <div className="relative">
            <Input
              label="Current password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancel</Button>
            <Button type="submit" size="sm" loading={loading} className="bg-red-600 hover:bg-red-700">Disable 2FA</Button>
          </div>
        </form>
      </div>
    )
  }

  return null
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Mail } from 'lucide-react'
import { authClient, useSession } from '@/lib/auth-client'
import Button from '@/components/ui/Button'

export default function VerifyEmailPage() {
  const { data: session } = useSession()
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleResend() {
    if (!session?.user?.email) return
    setLoading(true)
    await authClient.sendVerificationEmail({ email: session.user.email, callbackURL: '/dashboard' })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-teal-700 mb-8">
          <Building2 className="h-5 w-5" strokeWidth={2} />
          <span className="font-bold text-gray-900">TradeConnect</span>
        </Link>
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 mb-4">
          <Mail className="h-8 w-8 text-teal-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Verify your email</h1>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
          We sent a verification link to <strong>{session?.user?.email}</strong>.<br />
          Click the link to unlock your account.
        </p>
        {sent ? (
          <p className="text-sm text-teal-700 font-medium">Verification email resent!</p>
        ) : (
          <Button onClick={handleResend} loading={loading} variant="ghost" size="sm">Resend email</Button>
        )}
        <div className="mt-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import SecurityClient from './SecurityClient'

export default async function SecurityPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const twoFactorEnabled = (session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled ?? false

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Security</h1>
      <p className="text-sm text-gray-500 mb-8">Manage two-factor authentication and account security.</p>
      <SecurityClient twoFactorEnabled={twoFactorEnabled} userEmail={session.user.email} />
    </div>
  )
}

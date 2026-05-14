'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Package, ShoppingCart, Link2, Settings, Building2, LogOut, Plug, Shield } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/matches', label: 'Matches', icon: Users },
  { href: '/listings', label: 'My Listings', icon: Package },
  { href: '/needs', label: 'My Needs', icon: ShoppingCart },
  { href: '/connections', label: 'Connections', icon: Link2 },
  { href: '/security', label: 'Security', icon: Shield },
  { href: '/integrations', label: 'Integrations', icon: Plug },
  { href: '/profile', label: 'Profile', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-200 px-5">
        <Building2 className="h-5 w-5 text-teal-700" strokeWidth={2} />
        <span className="text-sm font-bold tracking-tight text-gray-900">TradeConnect</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

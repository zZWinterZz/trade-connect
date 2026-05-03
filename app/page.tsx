import Link from 'next/link'
import { Building2, ArrowRight, CheckCircle, Users, MapPin, Package } from 'lucide-react'

const steps = [
  {
    icon: Building2,
    number: '01',
    title: 'Register your business',
    body: 'Create a profile in minutes. Tell us what you supply and what you need — from products to services.',
  },
  {
    icon: Users,
    number: '02',
    title: 'Get matched automatically',
    body: "Our matching engine finds compatible businesses nearby based on what you sell and what they need — and vice versa.",
  },
  {
    icon: ArrowRight,
    number: '03',
    title: 'Connect and trade',
    body: 'Send a connection request, share contact details, and start trading with local partners who already need what you offer.',
  },
]

const categories = [
  'Food & Beverage', 'Linen & Laundry', 'Cleaning Supplies', 'Maintenance', 'Logistics',
]

export default function LandingPage() {
  return (
    <div className="min-h-full bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-teal-700" strokeWidth={2} />
            <span className="font-bold tracking-tight text-gray-900">TradeConnect</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
          Now live across the UK
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 leading-tight max-w-3xl mx-auto">
          Your local supply network,{' '}
          <span className="text-teal-700">automated</span>
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          TradeConnect matches businesses with the suppliers and buyers they need — based on what you offer, what you need, and how close you are.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-6 py-3 text-base font-medium text-white hover:bg-teal-800 transition-colors"
          >
            Register your business
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-teal-600" />
            Free to join
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-teal-600" />
            No middleman fees
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-teal-600" />
            Proximity-based matching
          </div>
        </div>
      </section>

      {/* Categories strip */}
      <section className="border-y border-gray-100 bg-gray-50 py-5">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-3 overflow-x-auto">
            <span className="shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wider">Sectors</span>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <span key={cat} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
          <p className="mt-3 text-gray-500">Three steps from sign-up to first trade</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="relative rounded-2xl border border-gray-200 bg-white p-8">
              <div className="absolute -top-3 left-6 rounded-full bg-teal-700 px-2.5 py-0.5 text-xs font-bold text-white">
                {step.number}
              </div>
              <step.icon className="h-7 w-7 text-teal-700 mb-4" strokeWidth={1.5} />
              <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="bg-gray-50 border-t border-gray-100 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Built for every business in the supply chain</h2>
              <div className="space-y-4">
                {[
                  { icon: MapPin, text: 'Radius-based matching — find suppliers within 5 to 50 miles' },
                  { icon: Package, text: 'Category-aware — food, linen, cleaning, maintenance, logistics' },
                  { icon: Users, text: 'Both sides of the trade — register as supplier, buyer, or both' },
                  { icon: CheckCircle, text: 'Verified business badges for Pro subscribers' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-teal-100 p-1.5">
                      <Icon className="h-3.5 w-3.5 text-teal-700" />
                    </div>
                    <p className="text-sm text-gray-700">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Your matches today</span>
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">12 new</span>
              </div>
              {[
                { name: 'Metro Linen Services', cat: 'Linen & Laundry', dist: '2.3 mi', type: 'Supplier' },
                { name: 'Fresh Fields Produce', cat: 'Food & Beverage', dist: '4.1 mi', type: 'Both' },
                { name: 'CleanPro Supplies', cat: 'Cleaning Supplies', dist: '6.8 mi', type: 'Supplier' },
              ].map((m) => (
                <div key={m.name} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700 text-xs font-bold">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.cat}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{m.dist}</p>
                    <span className="text-xs text-teal-700 font-medium">{m.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to grow your supply network?</h2>
        <p className="text-gray-500 mb-8 max-w-xl mx-auto">
          Join hundreds of businesses already trading smarter with TradeConnect.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-8 py-3.5 text-base font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Register free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-700" />
            <span className="text-sm font-semibold text-gray-900">TradeConnect</span>
          </div>
          <p className="text-xs text-gray-400">© 2025 TradeConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

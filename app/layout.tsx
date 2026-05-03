import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TradeConnect — Your local supply network',
  description: 'B2B business directory connecting local suppliers and buyers in the hospitality supply chain.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} antialiased h-full bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  )
}

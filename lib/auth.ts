import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { twoFactor } from 'better-auth/plugins'
import { db } from '@/lib/db'
import { user, session, account, verification, twoFactorTable } from '@/lib/db/schema'
import { sendEmail } from '@/lib/email'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification, twoFactor: twoFactorTable },
  }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user: u, url }: { user: { email: string; name?: string }; url: string }) => {
      await sendEmail({
        to: u.email,
        subject: 'Verify your TradeConnect email',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2>Verify your email</h2>
            <p>Hi ${u.name || u.email},</p>
            <p>Click the button below to verify your TradeConnect account.</p>
            <a href="${url}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Verify email</a>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">This link expires in 24 hours. If you did not create an account, ignore this email.</p>
          </div>
        `,
      })
    },
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
  },
  plugins: [
    twoFactor({
      issuer: 'TradeConnect',
      totpOptions: { digits: 6, period: 30 },
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
})

export type Session = typeof auth.$Infer.Session

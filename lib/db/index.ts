import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const url = process.env.DATABASE_URL!

// Heroku Postgres (and most hosted providers) require SSL.
// rejectUnauthorized: false is needed because Heroku uses self-signed certs.
const isProd = process.env.NODE_ENV === 'production' || url?.includes('amazonaws.com')

const client = postgres(url, {
  ssl: isProd ? { rejectUnauthorized: false } : false,
})

export const db = drizzle(client, { schema })

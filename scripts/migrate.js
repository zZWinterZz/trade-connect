/**
 * Release-phase migration script.
 * Runs on every Heroku deploy (and can be run locally too).
 * Uses IF NOT EXISTS throughout so it is safe to run repeatedly.
 *
 *   node scripts/migrate.js
 */

'use strict'

const fs   = require('fs')
const path = require('path')
const postgres = require('postgres')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('ERROR: DATABASE_URL is not set')
  process.exit(1)
}

// Heroku Postgres requires SSL in production; skip verification because
// Heroku uses self-signed certificates.
const isProd = process.env.NODE_ENV === 'production' || url.includes('amazonaws.com')
const sql = postgres(url, {
  ssl: isProd ? { rejectUnauthorized: false } : false,
  max: 1,
})

const schemaPath = path.join(__dirname, 'schema.sql')
const schemaSql  = fs.readFileSync(schemaPath, 'utf8')

async function main() {
  console.log('Running schema migration…')
  await sql.unsafe(schemaSql)
  console.log('Migration complete.')
  await sql.end()
}

main().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})

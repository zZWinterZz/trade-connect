# TradeConnect — Setup Guide

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL 16 (Docker) |
| ORM | Drizzle ORM |
| Auth | Better Auth (email + password) |
| Deployment | Vercel + any hosted Postgres |

No Supabase. Everything runs locally in Docker.

---

## Prerequisites

- Docker Desktop running
- Node 18+

---

## 1. Start Postgres

```bash
docker compose up -d
```

This starts a Postgres 16 container on port 5432 with database `tradeconnect`.

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tradeconnect

# Generate a secret:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
BETTER_AUTH_SECRET=your-random-secret-here

BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Optional — without this, postcodes get random London-area coordinates
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## 4. Push the database schema

```bash
npm run db:push
```

This creates all tables, enums, indexes and constraints directly from the Drizzle schema.
No migration files needed for local dev. For production, use `npm run db:generate` + `npm run db:migrate`.

---

## 5. Seed demo data

```bash
npm run seed
```

Creates 20 realistic London hospitality businesses with listings and needs.
All seed accounts use password: **`SeedPass123!`**

Example logins:
- `metro.linen@seed.tc` — Metro Linen Services (Pro, Verified)
- `borough.hotel@seed.tc` — The Borough Hotel (buyer, needs matching)
- `canopy.restaurant@seed.tc` — Canopy Restaurant Group (active buyer)

---

## 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 7. Drizzle Studio (optional DB browser)

```bash
npm run db:studio
```

Opens a web UI at `https://local.drizzle.studio` to browse and edit data.

---

## 8. Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables (use a hosted Postgres URL — Neon, Railway, or Supabase pooler)
4. Deploy

```bash
# For production DB schema:
npm run db:generate   # generates migration files
npm run db:migrate    # applies migrations
```

---

## Architecture

```
app/
  page.tsx                        Landing page
  (auth)/
    login/                        Better Auth sign in
    register/                     4-step onboarding wizard
  (dashboard)/
    layout.tsx                    Auth guard (auth.api.getSession)
    dashboard/                    Overview + stats + match preview
    matches/                      Full matches view with filters
    listings/                     CRUD — what you sell
    needs/                        CRUD — what you need
    connections/                  Inbox: accept/decline + contacts
    profile/                      Edit business profile
  api/
    auth/[...all]/                Better Auth handler
    matches/                      Match computation endpoint (GET)
  actions/
    business.ts                   createBusiness server action
    listings.ts                   CRUD server actions
    needs.ts                      CRUD server actions
    connections.ts                sendRequest / updateStatus
    profile.ts                    updateProfile

lib/
  auth.ts                         Better Auth config (Drizzle adapter)
  auth-client.ts                  Browser auth client
  db/
    schema.ts                     Drizzle schema (auth tables + app tables)
    index.ts                      DB client (postgres.js)
  utils.ts                        Haversine, match scorer, formatters

types/index.ts                    Shared TypeScript types + constants
middleware.ts                     Lightweight cookie-based route guard
scripts/seed.ts                   20-business London seed data
docker-compose.yml                Postgres 16 container
drizzle.config.ts                 Drizzle Kit config
```

---

## Matching algorithm

```
score = (category_overlap × 0.6) + (proximity × 0.4)
```

- **Category overlap**: how many of their listing categories match your needs, and vice versa
- **Proximity**: inverse linear score from 0 (at radius edge) to 1 (co-located)
- Businesses with any existing connection (pending or accepted) are excluded
- Free tier: max 5 matches shown; Pro: unlimited

---

## Subscription tiers

| | Free | Pro (£49/mo) |
|---|---|---|
| Listings | 1 | Unlimited |
| Needs | 1 | Unlimited |
| Matches visible | 5 | All |
| Connection requests/month | 3 | Unlimited |
| Verified badge | — | Yes |

Payment integration not implemented yet. The upgrade button is wired to a placeholder.

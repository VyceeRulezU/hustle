# The Hustle Receipt

A creator tip page powered by real Flutterwave payments. Fans tip via a shared link, get a verified receipt. Creators see everything on their dashboard.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 App Router (TypeScript) |
| Styling | Tailwind CSS v4 |
| Auth | NextAuth v5 (Credentials + JWT) |
| ORM | Prisma v7 |
| Database | Neon Postgres |
| Payments | Flutterwave Standard (server-side initiation + verification) |
| Data fetching | React Query (TanStack) — 5 min stale, background revalidation |

## Quick start

```bash
# 1. Install
npm install

# 2. Set env vars — copy from .env.local template and fill in your keys
#    (Flutterwave test keys, NEXTAUTH_SECRET, etc.)

# 3. Push schema to your Neon database
npx prisma migrate dev --name init

# 4. Run
npm run dev
```

Visit `http://localhost:3000` → sign up → share your `/tip/[slug]` page → receive tips.

## Routes

| Route | Description |
|---|---|
| `/` | Landing |
| `/login` | Creator login |
| `/signup` | Creator signup |
| `/tip/[slug]` | Public tip page (no auth required) |
| `/tip/[slug]/success` | Post-payment verified receipt |
| `/dashboard` | Protected — stats, recent tips, message wall |

## API

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | None | Register creator |
| POST | `/api/tip/initiate` | None | Initiate Flutterwave payment |
| GET | `/api/tip/verify` | None | Verify transaction server-side |
| GET | `/api/dashboard` | Required | Aggregated tip data |

## Project structure

```
app/           — All routes (App Router)
components/    — Reusable UI (TipForm, DashboardStats, RecentTips, MessageWall)
lib/           — auth.ts, flutterwave.ts, prisma.ts, utils.ts
prisma/        — Schema + migrations
plan/          — Original build docs
```

## Deploy to Netlify

1. Push to GitHub
2. Connect repo in Netlify
3. Set all env vars from `.env.local` in Netlify dashboard
4. Build command: `npm run build`
5. Publish directory: `.next`
6. Set `NEXT_PUBLIC_BASE_URL` to your Netlify domain

## Test payments

Use Flutterwave test card: `5531 8866 5214 2950` (CVV: `564`, Exp: `09/32`, PIN: `3310`, OTP: `12345`).

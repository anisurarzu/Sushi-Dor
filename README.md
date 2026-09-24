# Sushi D'or

Modern web app for a French sushi restaurant — inspired by [Eat Sushi](https://eatsushi.fr/).

## Stack

- **Next.js 16** (App Router) + TypeScript
- **PostgreSQL** + **Prisma 6**
- **Tailwind CSS v4**
- **Zustand** (client state) + **Framer Motion** (motion)

## Getting started

```bash
npm install
cp .env.example .env
# set DATABASE_URL to your Postgres (Neon / Supabase / local)
npm run db:push
npm run dev
```

## Deploy

Configured for **Vercel**. Set `DATABASE_URL` in project environment variables when the DB is connected.

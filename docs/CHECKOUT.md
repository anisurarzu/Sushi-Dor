# Cart + checkout + Stripe add-ons

## Local setup

1. PostgreSQL running (this project uses port **5433** for Homebrew PG16).
2. `cp .env.example .env` and set `DATABASE_URL`.
3. `npx prisma db push && npm run db:seed`
4. Set Stripe test keys in `.env`.
5. `npm run dev`

Admin: `/admin/login` — `admin@sushidor.fr` / `ChangeMe123!` (change immediately).

## Acceptance test (California Saumon)

1. Open `/menu` → **California SAUMON AVOCAT** (SKU 110).
2. Choose **Sauce Spicy** (+0,50 €), **Avocat** (+1,50 €), qty **2**.
3. Expected live total: **21,80 €**.
4. Add to cart → checkout → delivery +3,00 € → **24,80 €**.
5. Stripe Checkout amount must be **2480** cents.
6. After webhook: order **PAID**, admin shows addons × qty.

## Stripe webhook (local)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

## Production notes

- Frontend: Vercel — set all env vars including `DATABASE_URL` (Contabo Postgres).
- Webhook endpoint: `https://YOUR_DOMAIN/api/stripe/webhook`
- Never trust frontend totals; checkout recalculates from DB.

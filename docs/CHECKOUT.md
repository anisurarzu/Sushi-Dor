# Checkout (Sushi D'or)

Server-side pricing → Stripe **TEST** Checkout → webhook → order CONFIRMED.

Full Stripe sandbox guide: [STRIPE_TESTING.md](./STRIPE_TESTING.md)

## Flow

1. Cart stores productId + addonIds + qty (no trusted prices from the browser).
2. `POST /api/checkout/create-session` recalculates from PostgreSQL.
3. Stripe Checkout Session (TEST keys only).
4. Webhook `checkout.session.completed` → Payment **PAID**, Order **CONFIRMED**.
5. Success: `/checkout/success?session_id={CHECKOUT_SESSION_ID}`
6. Cancel: `/checkout/cancel` (cart kept, order unpaid).

## Local webhook

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Production webhook

```
https://sushi-dor.vercel.app/api/stripe/webhook
```

# Stripe TEST / SANDBOX — Sushi D'or

This project uses **Stripe TEST mode only** during development.

## Required env (TEST keys)

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...   # or sandbox rkcs_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Never commit `.env` / `.env.local`.  
Never use `sk_live_` / `pk_live_` keys in this stage.

## Local webhook with Stripe CLI

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`, then restart `npm run dev`.

## Test card (TEST mode only — never show in production UI)

- Card: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits
- ZIP: any valid value

Decline card example: `4000 0000 0000 0002`

## Flow

1. Add products / add-ons to cart  
2. `/checkout` → customer info  
3. Server recalculates prices from PostgreSQL  
4. Stripe Checkout Session (TEST)  
5. Pay with test card  
6. Webhook `checkout.session.completed` → Payment **PAID**, Order **CONFIRMED**  
7. `/checkout/success?session_id=...`

Cancel → `/checkout/cancel` (order stays unpaid, cart kept).

## Production (Vercel)

Webhook URL:

```
https://sushi-dor.vercel.app/api/stripe/webhook
```

Events to enable:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.expired`
- `payment_intent.payment_failed`
- `charge.refunded`

Set the same TEST keys in the Vercel project env until you intentionally switch to live mode.

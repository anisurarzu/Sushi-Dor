# Sushi D'or — Phase 1 Analysis & Implementation Plan

## Existing project snapshot (as of analysis)

| Item | Finding |
|------|---------|
| Framework | **Next.js 16.3.6** (App Router) + React 19 + TypeScript |
| Styling | **Tailwind CSS v4** (`@import "tailwindcss"`) + CSS variables (gold/ink brand) |
| Router | App Router only (`src/app/`) — **no Pages Router** |
| Routes today | `/` only (+ `_not-found`) |
| Components | Marketing homepage: `SiteHeader`, `Hero`, `CartePreview`, `Signature`, `Loyalty`, `Restaurants`, `OrderCta`, `SiteFooter` |
| API | **None** |
| Auth | **None** |
| Payments | **None** |
| DB | Prisma 6 schema stub (Category/Product/Restaurant/Customer/Order) — **not migrated / unused by UI** |
| Images | Unsplash URLs (placeholder) — replace with menu assets |
| Deploy | Vercel (`sushi-dor.vercel.app`) linked to GitHub |
| Fake claims | Multi-city “France” restaurants, loyalty 5€, “livraison 7/7 partout” — must become **DB-driven / removable** |

## Menu source (`Menu sushi d’or.pages`)

- Exported to PDF (16 pages) → `data/menu/menu.txt`
- Categories present: Entrées, Sushi, Tartare, Carpaccios & Tataki, Chirashi, Sashimis, Spécialité, Maki, Fresh Maki, California, Signature California, Plats cuisinés, Accompagnements, Menu midi / Plateaux / Box
- ~90+ priced products with French names
- Product photos extracted to `public/menu/` (Pages Data assets)
- **Allergens**: mostly absent in source → leave empty / admin-editable
- **Ingredients**: present for some makis/californias only — store when available, never invent

## Reuse vs replace

**Keep / evolve**
- Brand tokens (`globals.css`: ink/gold/champagne)
- Fonts (Cormorant Garamond + Outfit)
- `btn-gold` / `btn-ghost` / `gold-text`
- Homepage shell — wire CTAs to `/menu`, `/reservation`; remove fake multi-city/loyalty until real data exists

**Replace**
- Static category cards → DB products
- Anchor-only nav → real routes
- Stub Prisma Order enums → full order/payment/reservation models

## Technical fixes before features

1. Expand Prisma schema + migrations (replace incomplete enums)
2. Add validation (`zod`), auth (`bcrypt` + session cookies), Stripe, Resend
3. Stop shipping fake restaurant claims on homepage
4. `.env.example` for all secrets; never commit `.env`
5. Make `prisma generate` safe when `DATABASE_URL` missing for pure UI builds (optional dummy)

## Target architecture (pragmatic production)

- **Vercel**: Next.js App Router (UI + Route Handlers) — current deploy
- **PostgreSQL**: Contabo (or Neon for staging) via `DATABASE_URL`
- **API**: Next.js `/api/*` now; Contabo Node service later if needed (`api.sushidor.fr`)
- **Images**: `public/menu` initially → Contabo object storage later via `UPLOAD_*`
- **Stripe** Checkout + webhook signature verification
- **Email**: Resend transactional

## Phased delivery (this build)

1. Analysis ✅  
2. Schema + seed from menu.txt  
3. Public menu / product / cart  
4. Checkout + Stripe + order tracking  
5. Reservations + anti double-book  
6. Admin dashboard  
7. Auth (customer optional + admin)  
8. Emails + GDPR/cookies/legal  
9. SEO + sticky cart + polish  
10. Deploy docs  

## Business info still required from owner

- Real restaurant address, phone, email, GPS
- Opening hours & reservation capacity
- Delivery zones / fees / radius
- Whether delivery is offered at all
- Stripe live keys + webhook endpoint
- Resend domain / from address
- Admin email for bootstrap
- Mentions légales (SIRET, éditeur, hébergeur)
- Loyalty program rules (or disable)

# Sampath Food City

Sampath Food City is a multi-branch shopping storefront and operations dashboard built with Next.js, Prisma and PostgreSQL, with SST-inspired black and red branding.

## Storefront delivery flow

- Customers can choose from all active Sampath Food City branches.
- Products, stock and prices are loaded from the selected branch inventory.
- Changing branch clears the cart because cart prices and availability are branch-specific.
- Checkout requires an exact map location.
- The server calculates the distance from the selected branch using the Haversine formula.
- Orders are accepted only when the location is within the branch delivery radius (20 km by default).
- Delivery fee defaults to **LKR 100 base + LKR 30/km**, rounded up to the nearest LKR 10.
- Fee defaults can be overridden with `DELIVERY_BASE_FEE_LKR` and `DELIVERY_PER_KM_FEE_LKR`.
- Cash on Delivery is currently supported.

## Branch inventory

The demo seed contains seven branches: Horana, Ingiriya, Bandaragama, Kesbewa, Piliyandala, Panadura and Kalutara. Each active branch receives the seeded demo products in `prisma/seed.ts`.

## Staff access

The administrator dashboard can create:

- Branch Manager accounts
- Branch Staff accounts

Delivery personnel are not given dashboard access and are not created through the administration dashboard.

## Push notifications

The application uses standard Web Push for supported staff notifications. Notifications are persisted in PostgreSQL and shown in the in-app notification bell.

Generate a VAPID key pair once:

```bash
npx web-push generate-vapid-keys
```

Add the generated values to `.env` using an appropriate business-owned VAPID subject:

```env
VAPID_SUBJECT="mailto:your-business-email@example.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key"
VAPID_PRIVATE_KEY="your-private-key"
```

`VAPID_PRIVATE_KEY` must remain server-only. Never expose it with a `NEXT_PUBLIC_` prefix and never commit it.

For local development, use `http://localhost` or another secure HTTPS origin. Production deployments must use HTTPS for browser push.

## Development

```bash
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

For a production build:

```bash
npm run build
```

The repository CI workflow runs dependency installation, Prisma Client generation, linting and the production build on pushes to `main` and pull requests.

## Deployment

Production deploys are connected to the `main` branch on Vercel.

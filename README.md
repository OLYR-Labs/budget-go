# Budget Go

Budget Go is a multi-branch delivery storefront and operations dashboard built with Next.js, Prisma and PostgreSQL.

## Storefront delivery flow

- Customers can choose from all active branches.
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

## Push notifications

Budget Go uses standard Web Push for the free demo. Branch managers/staff receive new-order notifications and delivery staff receive assignment notifications. Notifications are also persisted in PostgreSQL and shown in the in-app notification bell.

Generate a VAPID key pair once:

```bash
npx web-push generate-vapid-keys
```

Add the generated values to `.env`:

```env
VAPID_SUBJECT="mailto:hello@budgetgo.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key"
VAPID_PRIVATE_KEY="your-private-key"
```

`VAPID_PRIVATE_KEY` must remain server-only. Never expose it with a `NEXT_PUBLIC_` prefix and never commit it.

The browser will show **Enable notifications** to authenticated branch/admin/delivery users when push is configured. The user must grant notification permission on each device/browser they want to receive alerts on.

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

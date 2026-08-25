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

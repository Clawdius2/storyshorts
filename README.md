# StoryShorts MVP

StoryShorts is a Next.js App Router frontend for short-form audio fiction, paired with the existing Cloudflare Worker in `src/index.js` that streams audio and cover assets from Cloudflare R2.

## Stack

- Next.js App Router with TypeScript
- Clerk authentication
- Stripe Checkout subscriptions
- Prisma with Postgres
- Cloudflare Worker + R2 for audio and cover delivery

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in the real values:

```bash
cp .env.example .env.local
```

3. Generate the Prisma client, run migrations or push the schema, and seed the catalog:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

4. Start the frontend:

```bash
npm run dev
```

5. Run the existing Cloudflare audio worker separately when needed:

```bash
npm run worker:dev
```

## Environment variables

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

## Stripe webhook

Point Stripe webhooks at:

```text
/api/webhooks/stripe
```

Recommended events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Routes

- `/`
- `/catalog`
- `/book/[id]`
- `/player`
- `/subscribe`
- `/subscribe/success`
- `/subscribe/cancel`
- `/sign-in`
- `/sign-up`

## Notes

- Audio streams and cover art resolve through `https://audio.storyshorts.co/{key}`.
- The initial catalog is seeded with five free titles plus premium placeholders for the gated library.
- Subscription gating is enforced in the app layer and progress is stored per user in Postgres.

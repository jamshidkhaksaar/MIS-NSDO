This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database Setup

The development build now targets SQLite. Point `DB_SQLITE_PATH` (see `.env.example`) at a writable location—by default it uses `./database/dev.db`. Apply the schema and optional seed data with the `sqlite3` CLI:

```bash
sqlite3 ./database/dev.db < database/schema.sql
sqlite3 ./database/dev.db < database/sample-data.sql
```

Copy `.env.example` to `.env.local` (the default path suits most development setups):

```bash
cp .env.example .env.local
```

## Getting Started

Install dependencies and run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Administrative Utilities

Create or update an administrator without touching the seed data by running:

```bash
DB_SQLITE_PATH=./database/dev.db \
npm run create-admin-user -- --name "Fatima Ahmadi" --email fatima.ahmadi@nsdo.org.af --organization "NSDO HQ"
```

If you omit the flags it will upsert a default `Administrator <it@nsdo.org.af>` user in the “NSDO IT Unit” organization with password `Kabul@321$` (stored as a bcrypt hash). Provide `--password` to override. The script looks up the email and updates the record if it already exists.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

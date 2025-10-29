This project runs on Next.js App Router with typed React components.

## Database Setup (Supabase / Postgres)
1. Copy the example env file and fill in your connection string:
   ```bash
   cp .env.example .env.local
   ```
   Set `DATABASE_URL` to the Postgres URI from Supabase (or another managed Postgres).

2. Update `supabase/config.toml` with your Supabase project ref. If you have the Supabase CLI installed:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   ```

3. Apply the schema migrations to your database:
   ```bash
   supabase db push
   ```
   The migrations live in `supabase/migrations/` and target the `public` schema.

4. (Optional) Load the starter data:
   ```bash
   psql "$DATABASE_URL" -f supabase/seed/sample-data.sql
   ```

## Local Development
Install dependencies (Node.js 20+) and run the dev server:
```bash
npm install
npm run dev
```
Visit http://localhost:3000 to inspect the app. Turbopack hot-reloads changes by default.

## Administrative Utilities
Provision or update an administrator directly in Postgres:
```bash
DATABASE_URL="postgres://user:pass@host:5432/db" \
npm run create-admin-user -- --name "Fatima Ahmadi" --email fatima.ahmadi@nsdo.org.af --organization "NSDO HQ"
```
Provide `--password` to override the default and the script will upsert by email.

## Deploy on Vercel
- Add `DATABASE_URL` (and optional `PGSSLMODE` / `PGPOOL_MAX`) to the Vercel project settings.
- Ensure the value matches your Supabase connection string (include `sslmode=require`).
- Run `npm run build` locally or rely on Vercel’s build for production.

## Learn More
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase CLI Reference](https://supabase.com/docs/guides/cli)
- [Vercel Deployment Docs](https://nextjs.org/docs/app/building-your-application/deploying)

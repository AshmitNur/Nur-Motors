# Nur Motors & Electronics

Motorbike business management MVP built from `PRD.md`.

## What Is Included

- React + Vite frontend using the Stitch-generated `Kinetic Utility` admin design direction.
- Supabase-ready backend schema in `supabase/migrations/20260521140000_initial_schema.sql`.
- Core modules: dashboard, bike sales, due tracking, service, inventory, finance, customers, reports, backup, and activity log.
- Production auth gate with Supabase Auth.
- Owner-only staff user creation for manager, accountant, and staff roles.
- Bike sale profit and due calculations.
- Due collection drawer with receipt creation flow.
- Demo data fallback when Supabase environment variables are not configured.

## Local Development

```bash
npm install
npm run dev -- --port 5173
```

Open `http://127.0.0.1:5173/`.

## Supabase Production Setup

1. Create a Supabase project.
2. Run the SQL migration from `supabase/migrations/20260521140000_initial_schema.sql`.
3. Optionally run `supabase/seed.sql` for starter data.
4. Copy `.env.example` to `.env` and set:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
```

This app is Vite React, so use `VITE_` environment variable names. The Next.js `NEXT_PUBLIC_*`, `page.tsx`, and middleware examples from Supabase docs are for Next.js projects and are not used here.

5. Deploy the owner-only user creation function:

```bash
supabase functions deploy create-user
```

The function uses `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`, which Supabase provides to Edge Functions in a linked project.

6. Bootstrap the first owner account:

- Create the first owner user in the Supabase Auth dashboard.
- Copy that user's Auth UID.
- Insert a matching owner profile:

```sql
insert into public.user_profiles (id, display_name, role)
values ('AUTH_USER_ID_HERE', 'Owner', 'owner');
```

After that, the owner signs in through the app and creates manager, accountant, and staff user IDs/passwords from `Activity Log > Owner User Management`.

The migration includes tables, role-based RLS policies, update triggers, sale/due status calculations, activity logs, invoice/receipt tables, and the `record_due_payment` RPC.

## Role Model

- Owner: all modules, user creation, deletion approval, reports, backup, audit log.
- Manager: dashboard, sales, due collection, service, stock, customers, operational reports.
- Accountant: dashboard, debit/credit, salary, expenses, financial reports.
- Staff: sales/service/customer working screens only.

Users cannot self-register. Owner-created credentials are required.

## Stitch UI Work

Stitch project: `projects/1804378924109465248`

Generated screens:

- Dashboard: `projects/1804378924109465248/screens/53d02a9e75e048a89c7e344adc2ad139`
- Sales and due management: `projects/1804378924109465248/screens/d73ebdb0dfcb442eb21cd470ed4dd1eb`

Design system asset: `assets/36bfa2f98759466e9ccf6d06571b5659`

## Verification

```bash
npm run build
```

The browser smoke test verified:

- Dashboard loads.
- Sales & Dues navigation works.
- Active Dues tab opens.
- Collect Payment drawer opens.
- No browser console errors were reported.

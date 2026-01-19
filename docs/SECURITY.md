# Security Guidelines

## Environment Variables
This project uses sensitive environment variables. **NEVER** commit `.env` or `.env.local` to version control.
The `.env.example` file serves as a template with variable names only.

### Required Variables
- `DATABASE_URL`: Connection string for the Supabase Transaction Pool (port 6543).
- `DIRECT_URL`: Connection string for the Session Pool (port 5432) used by Prisma for migrations.
- `NEXTAUTH_SECRET`: Strong random string for encryption.
- `NEXTAUTH_URL`: Canonical URL of the site.
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_ANON_KEY`: The `anon` public key for client-side Storage upload.

## Rate Limiting
- Auth endpoints are rate-limited by IP to prevent brute-force attacks.
- Basic implementation uses `lru-cache` in memory. In a serverless environment (Vercel), this is per-lambda instance.

## Bootstrapping & Seeding
To initialize the system securely:
1. Set `ENABLE_BOOTSTRAP="true"` in environment variables.
2. Run `npx prisma db seed` to create the initial admin account and farm profile.
3. Reset `ENABLE_BOOTSTRAP="false"` immediately after.

## Multi-tenant Isolation
Every model is keyed by `farm_id`. Isolation is enforced:
- **Server Actions**: Every action calls `getSessionFarmIdOrThrow()` to validate the user's scope.
- **Client Side**: Dashboards fetch data only for the authenticated session's farm.

## RBAC Enforcement
- **Admin**: Full access to all data within their `farm_id`.
- **Employee**: Access RESTRICTED to their own records and within their `farm_id`.

## Audit Logging
Critical actions are recorded in the `AuditLog` table:
- Login/Logout events.
- Contract creation/modification.
- Timesheet submission and approval.
- Pay Run execution and PDF generation.

Each log entry includes the actor's ID, Farm ID, Action type, and a JSON `metadata` field for additional context (e.g., resource IDs).

## Deployment (Vercel)
- Production environment variables are managed in the Vercel Project Settings.
- Do not check in `.env` files.

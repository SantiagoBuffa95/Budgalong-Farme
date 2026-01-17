# Security Guidelines

## Environment Variables
This project uses sensitive environment variables. **NEVER** commit `.env` or `.env.local` to version control.
The `.env.example` file serves as a template with variable names only.

### Required Variables
- `DATABASE_URL`: Connection string for the Supabase Transaction Pool (port 6543).
- `DIRECT_URL`: Connection string for the Session Pool (port 5432) used by Prisma for migrations.
- `AUTH_SECRET`: strong random string for encryption.
- `AUTH_URL`: Canonical URL of the site.
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The `anon` public key for client-side Storage upload.

## Rate Limiting
- Auth endpoints are rate-limited by IP to prevent brute-force attacks.
- Basic implementation uses `lru-cache` in memory. In a serverless environment (Vercel), this is per-lambda instance. For distributed consistency, use Redis (Upstash) in the future.

## RBAC & Multi-tenancy
- **Admin**: Full access to all data within their `farm_id`.
- **Employee**: Access RESTRICTED to their own records (`id` match required) and within their `farm_id`.
- **Strict Enforcement**: All Server Actions must use `getSessionFarmIdOrThrow()` to validate the context.
- **Isolation**: Every Prisma query must filter by `farm_id` where applicable.

## Audit Logs
Critical actions are logged to the `AuditLog` table.
- **Logged Events**: Contract creation/acceptance, Timesheet submission/approval, Pay Run finalization.
- **Immutable**: Audit logs should not be deletable by standard users.

## Deployment (Vercel)
- Production environment variables are managed in the Vercel Project Settings.
- Do not check in `.env` files to Vercel.

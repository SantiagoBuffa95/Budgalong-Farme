# Remote Database Workflows

This project uses GitHub Actions to manage database migrations and seeding remotely. This bypasses the need for local database access (Port 5432), which may be blocked on certain networks (e.g., Starlink).

## Setup (GitHub Secrets)

Go to **Settings > Secrets and variables > Actions** in your GitHub repository and add following secrets:

- `DATABASE_URL`: Connection string for your production database.
- `DIRECT_URL`: Direct connection string (essential for Prisma migrations).
- `ADMIN_EMAIL`: The email for the administrator account.
- `ADMIN_PASSWORD`: The password for the initial administrator account.

Optional for `db-seed`:
- `FARM_NAME`: Name of your farm.
- `FARM_ABN`: Australian Business Number for the farm.
- `FARM_ADDRESS`: Physical address.
- `FARM_TIMEZONE`: e.g., `Australia/Sydney`.

Variables (Optional):
- `SEED_DEMO`: Set to `true` (in Variables, not Secrets) if you want to create a demo employee.

## How to run

### 1. Migrations (New Database or Schema Changes)
Every time you change `prisma/schema.prisma` or deploy a new database:
1. Go to the **Actions** tab in GitHub.
2. Select **Database Migrate** on the left.
3. Click **Run workflow** > **Run workflow**.
4. Wait for it to finish (it runs `prisma migrate deploy`).

### 2. Seeding (Initial Setup)
To create the first Admin and Farm record:
1. Go to the **Actions** tab in GitHub.
2. Select **Database Seed** on the left.
3. Click **Run workflow** > **Run workflow**.
4. This runs `prisma db seed`. It is safe to run multiple times (idempotent); it won't overwrite existing admin credentials.

## Security
- The `db-seed` workflow is configured **not** to reset passwords for existing accounts. 
- After the initial seed, the administrator can change their password through the application UI (if implemented) or by manual rotation of the database hash.

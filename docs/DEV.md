# Developer Guide (DEV.md)

Welcome to the Budgalong development guide. This document contains everything you need to get the project running locally.

## Prerequisites
- **Node.js**: v20 or higher.
- **npm**: v10 or higher.
- **Supabase Account**: For database and storage.

## Local Setup

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd budgalong
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```
   > [!IMPORTANT]
   > Ensure `DATABASE_URL` and `DIRECT_URL` point to your Supabase project's transaction and session pools respectively.

4. **Initialize Database**:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Seed the database**:
   ```bash
   npx prisma db seed
   ```

## Running the Application

- **Development Server**:
  ```bash
  npm run dev
  ```
  Open [http://localhost:3000](http://localhost:3000) to see the result.

- **Production Build**:
  ```bash
  npm run build
  npm run start
  ```

## Quality Control

- **Linting**:
  ```bash
  npm run lint
  ```

- **Type Checking**:
  ```bash
  npm run typecheck
  ```

- **Running Tests**:
  ```bash
  # Run once
  npm run test
  # Watch mode
  npm run test:watch
  ```

## Testing Login Flow

### Local Development Credentials

After running `npx prisma db seed`, use these credentials:

**Admin Login** (`/admin/login`):
- Email: `admin@local.dev`
- Password: Check console output from seed command, or set `ADMIN_PASSWORD` in `.env`

**Employee Login** (`/login/employee`):
- Email: `employee@local.dev` (only if `SEED_DEMO_EMPLOYEE=true` in `.env`)
- Password: Check console output from seed command

### Expected Behavior

1. **Valid admin credentials** → Instant redirect to `/admin` dashboard (no intermediate screens)
2. **Valid employee credentials** → Instant redirect to `/employee` dashboard
3. **Invalid credentials** → Stay on login page with error: "Invalid credentials. Please check your email and password."
4. **Empty form submission** → Error: "Email and password are required."
5. **Employee trying to access admin** → Middleware redirects to `/employee` (if logged in) or `/login` (if not)

### Development Logging

When `NODE_ENV=development`, the console will show:
- `✓ Auth success: { email: '...', role: '...' }` on successful login
- `✗ Auth failed: Invalid credentials` on failed attempts

This helps debug authentication issues without exposing secrets.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Something went wrong" | Check that `AUTH_SECRET` and `NEXTAUTH_SECRET` match in `.env` |
| Redirect loop | Clear browser cookies and restart dev server |
| Session not found | Ensure `NEXTAUTH_URL=http://localhost:3000` (no trailing slash) |
| Login success but no redirect | Check browser console for errors; verify middleware is running |

## Database Management

- **Creating a Migration**:
  ```bash
  npx prisma migrate dev --name <migration_name>
  ```

- **Prisma Studio** (UI for database):
  ```bash
  npx prisma studio
  ```

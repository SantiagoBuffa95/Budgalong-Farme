# Developer Guide (DEV.md)

Welcome to the Rosi development guide. This document contains everything you need to get the project running locally.

## Prerequisites
- **Node.js**: v20 or higher.
- **npm**: v10 or higher.
- **Supabase Account**: For database and storage.

## Local Setup

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd rosi
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

## Database Management

- **Creating a Migration**:
  ```bash
  npx prisma migrate dev --name <migration_name>
  ```

- **Prisma Studio** (UI for database):
  ```bash
  npx prisma studio
  ```

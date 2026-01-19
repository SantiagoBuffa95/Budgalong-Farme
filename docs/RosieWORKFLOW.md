\# Rosie Workflow: Roles, Responsibilities \& Delivery Pipeline



This document describes how we work on \*\*Rosie\*\* (Next.js + Prisma + Supabase) using \*\*GitHub\*\*, \*\*GitHub Actions\*\*, and \*\*Vercel\*\*, with clear roles for the \*\*Product Owner\*\*, \*\*Google Antigravity\*\*, and \*\*ChatGPT\*\*.



---



\## Goals



1\. \*\*Efficiency:\*\* Changes should be fast to build and safe to ship.

2\. \*\*Economical:\*\* Minimal tooling, minimal wasted effort.

3\. \*\*Scalability:\*\* Same workflow works for 1 farm or 1000 farms.



---



\## Stack (Context)



\- \*\*Frontend/Backend:\*\* Next.js (App Router)

\- \*\*DB:\*\* Supabase Postgres

\- \*\*ORM:\*\* Prisma

\- \*\*Auth:\*\* NextAuth (server-side RBAC + farm isolation)

\- \*\*CI:\*\* GitHub Actions

\- \*\*Hosting:\*\* Vercel

\- \*\*Docs:\*\* `/docs`



---



\## Roles \& Responsibilities



\### Product Owner / System Owner (Business + UX Lead / Final Approver)

\*\*Owns:\*\*

\- Product direction (what we build next)

\- UI/UX preferences and visual approval

\- Business rules interpretation (farm needs, “what’s correct” for Budgalong and future farms)

\- Access control (tokens, env vars in Vercel, repo ownership)



\*\*Does:\*\*

\- Reviews Vercel Preview links and gives feedback

\- Approves merges to `main`

\- Handles unavoidable account-level tasks:

&nbsp; - GitHub repo ownership and access

&nbsp; - Vercel project setup + environment variables

&nbsp; - Supabase project settings (connection strings, storage buckets)



\*\*Does NOT need to do:\*\*

\- Large refactors or repeated CLI work (Google Antigravity should handle implementation)



---



\### Google Antigravity (Implementation Engineer)

\*\*Owns:\*\*

\- Writing code and shipping features in small increments

\- Keeping commits scoped and PRs reviewable

\- Maintaining tests, typecheck, build passing

\- Updating docs when behavior changes



\*\*Does:\*\*

\- Creates feature branches and Pull Requests (PRs)

\- Ensures GitHub Actions is green before requesting review

\- Uses server-side enforcement for RBAC + farm isolation

\- Avoids introducing unnecessary dependencies



\*\*Non-negotiable constraints:\*\*

\- Never commit secrets

\- No plaintext credentials anywhere

\- No client-side-only security checks (server enforcement required)



---



\### ChatGPT (Tech Lead / Architect / Auditor / Prompt Engineer)

\*\*Owns:\*\*

\- Breaking work into clean phases and tasks

\- Translating product intent into actionable prompts/tasks for Google Antigravity

\- Auditing outputs (security, tenancy, correctness, maintainability)

\- Identifying risks early (compliance, leakage, scaling, cost)



\*\*Does:\*\*

\- Provides checklists for PR review

\- Provides architecture guidance and design tradeoffs

\- Helps define “done” and acceptance criteria



---



\## Branching Strategy



\### Protected Branches

\- `main` = stable / production-ready

\- Optional: `staging` = pre-prod integration testing



\### Feature Branches

\- `feature/ui-polish`

\- `feature/holiday-calendar`

\- `fix/auth-rate-limit`

\- `chore/docs-update`



\*\*Rule:\*\* No direct commits to `main`. Everything goes through PR.



---



\## Pull Request (PR) Workflow



\### 1) Create Branch

Google Antigravity creates a branch for one scoped goal.



\### 2) Implement + Commit Small

Commits should be small and scoped:

\- One concern per commit

\- Clear messages like:

&nbsp; - `security: enforce farm isolation in payruns`

&nbsp; - `ui: unify admin layout shell`

&nbsp; - `docs: add deploy checklist`



\### 3) Open PR

PR must include:

\- What changed (summary)

\- How to test (steps)

\- Screenshots (if UI changes)

\- Any migrations (and how to apply)



\### 4) CI Runs Automatically (GitHub Actions)

PR must be green:

\- `npm ci`

\- `npm run typecheck`

\- `npm run test`

\- `npm run build`



\### 5) Vercel Preview Deploy

Vercel generates a preview link for the PR.

Product Owner reviews:

\- UI layout

\- Navigation

\- Key flows



\### 6) Approval + Merge

\- Product Owner approves after preview review

\- ChatGPT audits if needed (security/architecture)

\- Merge to `main`



---



\## Vercel Environments



\### Preview (per PR)

\- Automatically created for each PR branch

\- Used for UI/UX review and quick acceptance testing



\### Production (main)

\- Deploys when `main` changes

\- Should use production env vars

\- Bootstrap should be disabled



\### Environment Variables Policy

\- Secrets only live in:

&nbsp; - local `.env` (gitignored)

&nbsp; - Vercel Env Vars

\- Never commit `.env` or secret values

\- Keep `.env.example` names only (no values)



---



\## Database \& Migrations Workflow



\### Development

\- Use Prisma migrations in repo (`prisma/migrations`)

\- Local dev uses `.env` (gitignored)



\### Production / Staging

\- Migrations should be applied using a safe strategy:

&nbsp; - `prisma migrate deploy` (recommended for production)

\- `DIRECT\_URL` is used for migrations

\- `DATABASE\_URL` is used at runtime (pooler)



\*\*Rule:\*\* A PR that changes `schema.prisma` must include migrations and clear instructions.



---



\## Seed \& Bootstrap Policy



\### Seed (developer convenience)

\- `prisma db seed` for local/dev environments

\- Must not contain hardcoded secrets

\- Can generate passwords and print them locally



\### Bootstrap (customer onboarding)

\- Optional admin-only route/flow to initialize a new farm

\- Must be protected:

&nbsp; - `ENABLE\_BOOTSTRAP=true` only in local/staging

&nbsp; - never enabled in production after setup

\- Must write audit logs for bootstrap actions



---



\## Security Rules (Hard Requirements)



1\. \*\*Never commit secrets\*\*

&nbsp;  - `.env` and `.env.\*` must be ignored

2\. \*\*Passwords hashed\*\*

&nbsp;  - bcrypt or argon2 only

3\. \*\*Server-side RBAC\*\*

&nbsp;  - Roles: `admin`, `employee`, `accountant`

4\. \*\*Farm isolation everywhere\*\*

&nbsp;  - All DB reads/writes must be filtered by `farmId`

&nbsp;  - No relying on client checks

5\. \*\*Audit logging\*\*

&nbsp;  - Contract create/edit/accept

&nbsp;  - Timesheet submit/approve

&nbsp;  - Payrun generate/finalize

&nbsp;  - Payslip issue

6\. \*\*Secure defaults\*\*

&nbsp;  - Minimal permissions

&nbsp;  - Rate limiting on auth endpoints



---



\## Quality Gates (Definition of “Done”)



A feature is “done” when:

\- CI is green (typecheck + tests + build)

\- UI reviewed in Vercel Preview (if UI changed)

\- Docs updated if behavior changed

\- No secrets leaked

\- Farm isolation enforced server-side

\- Audit logs added for critical actions



---



\## Release / Deployment Process



\### Normal Release

1\. Merge PR into `main`

2\. Vercel deploys automatically

3\. Smoke test (basic):

&nbsp;  - login

&nbsp;  - admin dashboard loads

&nbsp;  - employee dashboard loads

&nbsp;  - create timesheet

&nbsp;  - generate payrun (if enabled)



\### Hotfix Release

\- Create `fix/...` branch

\- Small PR

\- Same CI rules apply

\- Merge quickly after review



---



\## Communication Cadence



\- Product Owner provides priorities and UI feedback

\- Google Antigravity ships PRs with previews

\- ChatGPT audits and adjusts plan



Preferred loop:

1\) Google Antigravity delivers PR + preview

2\) Product Owner reviews and lists adjustments

3\) ChatGPT translates feedback into next prompt/task

4\) Repeat



---



\## Suggested Folder for This Doc



Save as:

\- `docs/WORKFLOW.md`



And link it from `docs/README.md` or main `README.md` if desired.




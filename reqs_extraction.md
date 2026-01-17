# PROMPT REQUIREMENTS EXTRACTION

## Architecture
- **DB**: Supabase (Postgres)
- **ORM**: Prisma
- **Auth**: NextAuth.js (Database Sessions, hashed passwords with bcrypt/argon2)
- **Storage**: Supabase Storage (for PDF payslips)
- **Hosting**: Vercel

## Security
- No secrets in code.
- `.env.example` with variable names only.
- RBAC (Admin, Employee, Accountant).
- Multi-tenancy (`farm_id` enforcement).
- Audit Logs (critical actions).
- Rate limiting.

## Features
- Payroll Engine (Weekly pay run, Pastoral Award 2020 logic, Overtime, Allowances).
- Payslips (PDF generation + Cloud Upload).
- Leave Ledger (Annual leave balances).
- Employee Profiles.

## Data Model (Inferred)
- **User**: id, email, password_hash, role, farm_id.
- **EmployeeProfile**: user_id, classification, base_rate, allowances, leave_balance.
- **Timesheet**: id, employee_id, start_time, end_time, break_minutes, status, farm_id.
- **PayRun**: id, period_start, period_end, status, farm_id.
- **Payslip**: id, pay_run_id, employee_id, s3_url, gross, net, tax, super, farm_id.
- **AuditLog**: id, user_id, action, target_resource, timestamp, farm_id.

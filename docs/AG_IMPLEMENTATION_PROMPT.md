You are Google Antigravity working inside an existing Next.js repo.

Goal: convert current JSON-based prototype into production-ready web system (Vercel deploy + Supabase Postgres), focusing MVP on weekly payroll + contract generation.



Constraints:

1\) Must work reliably (no fragile hacks). Add tests for payroll calculations.

2\) Prefer cheaper/simpler tools if equal. Use Supabase Postgres + Prisma, deploy on Vercel.

3\) Multi-tenant: support multiple farms with farm\_id isolation (one codebase).



Repo audit findings to fix:

\- Hardcoded admin credential in code and plaintext passwords: replace with NextAuth + bcrypt + DB.

\- JSON files in /data for contracts/timesheets: migrate to DB tables.

\- payroll.ts uses outdated assumptions (public holiday multiplier, allowances amounts, super rate): replace with AwardPack driven rules.



Legal/compliance requirements (implement as features, not legal advice):

\- NSW public holidays list + local public holidays support (admin can add local PH by LGA); Bank Holiday is not a declared public holiday; Observances exist but do not trigger PH penalties.

\- Payslips must be issued within 1 working day of payment and include mandatory fields (employer/employee, pay period, pay date, gross/net, hourly rate \& hours if hourly, super, deductions).

\- Annual leave balance: full-time and part-time accrue 4 weeks/year based on ordinary hours; casual no paid annual leave.



Award baseline for MVP:

\- Pastoral Award MA000035: implement overtime/public holiday logic and key allowances from the award in a versioned AwardPack.

\- Make AwardPack updatable without code rewrite (DB table or json pack with version).



Deliverables:

A) Prisma schema + migrations for tables in DATA\_MODEL.md

B) NextAuth setup with DB sessions and hashed passwords

C) Payroll engine library: computePay() with unit tests

D) UI: Admin pay run screen + Employee payslip/leave screen

E) PDF generation: payslip PDF stored in Supabase storage

F) Seed data: one farm + admin + sample employee + sample timesheet



Acceptance:

\- Run locally with `pnpm dev` and Supabase connection

\- Create employee, create contract, submit timesheet, approve, run payrun, generate payslip PDF

\- Payroll unit tests cover: weekday OT, Sunday OT, public holiday, allowances, salary vs hourly




\# Technical Design v0.1 (Supabase + Vercel)



\## Stack

\- Next.js (App Router) + TypeScript

\- DB: Supabase Postgres

\- ORM: Prisma

\- Auth: NextAuth (Credentials + hashed passwords); sesiones en DB

\- PDF: jsPDF (mantener por ahora) o migrar luego a @react-pdf/renderer

\- Storage: Supabase Storage (payslips/contratos firmados)

\- Deploy: Vercel



\## Seguridad (mínimo aceptable)

\- Passwords: bcrypt (nunca texto plano)

\- RBAC: roles {super\_admin, farm\_admin, employee, accountant}

\- Multi-tenant: todas las tablas con farm\_id; validación server-side obligatoria

\- Rate-limit login + audit logs

\- (Opcional futuro) RLS en Supabase si queremos cinturón + tiradores



\## Compliance

\- Payslips: generar dentro de 1 working day del pago + campos obligatorios. 

\- Super: 12% OTE y cambios futuros: Payday super a partir del 1 July 2026 (mantenimiento). 



\## Domain core

Separar lógica pura en /src/lib/payroll-engine

\- AwardPack(versioned) + HolidayCalendar

\- computePay(contract, timesheet, context) -> payItems, totals

\- tests: golden test vectors por escenarios (weekday OT, sunday OT, public holiday, allowances)



\## Deployment notes (Vercel)

\- env vars: DATABASE\_URL, NEXTAUTH\_SECRET, NEXTAUTH\_URL, SMTP\_\*, SUPABASE\_\* (si aplica)

\- background jobs (si hiciera falta): Vercel Cron (payrun reminders / reissue statements)




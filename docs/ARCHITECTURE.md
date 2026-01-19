# System Architecture (ARCHITECTURE.md)

This document provides a high-level overview of the Rosi application's architecture and its core modules.

## Overview
Rosi is a multi-tenant payroll and farm management system built with Next.js, Prisma, and Supabase.

## Core Modules

### 1. Multi-tenancy & Isolation
- **Mechanism**: Every critical table (Employee, Contract, Timesheet, etc.) includes a `farmId`.
- **Enforcement**: Server Actions use a centralized `getSessionFarmIdOrThrow()` helper to ensure users can only ever access data belonging to their farm.
- **Prisma Middlewares**: (Planned) To further automate the injection of `farmId` in all queries.

### 2. Authentication (NextAuth.js)
- **Providers**: Credentials-based login with email/password.
- **Database**: Using `@auth/prisma-adapter` to store sessions and user data in PostgreSQL.
- **RBAC**: Roles (`admin`, `employee`) are stored on the `User` model and checked in Page layouts and Server Actions.

### 3. Payroll Engine
- **Logic**: Implemented in `src/lib/payroll/engine.ts`.
- **Compliance**: Follows the **Pastoral Award 2020** rules for ordinary hours, overtime, and penalty rates (Sundays/Public Holidays).
- **Pro-rata Accrual**: Automatically calculates leave accruals based on hours worked during a pay run.

### 4. Storage & Output
- **PDF Generation**: Receipts are generated server-side using `jspdf`.
- **Supabase Storage**: PDFs are uploaded to a private bucket (`payslips`) and accessed via signed URLs for security.
- **Folder Structure**: `payslips/{farmId}/{employeeId}/{payRunId}.pdf`.

## Data Flow

1. **Input**: Employees log hours via the Timesheet UI.
2. **Approval**: Admins review and approve hours.
3. **Execution**: The Payroll Engine processes approved timesheets, creating `Payslip` records.
4. **Storage**: PDFs are generated and stored in Supabase.
5. **Access**: Employees download receipts from their dashboard.

## Security Controls
- **Audit Logs**: All sensitive operations are logged to the `AuditLog` table.
- **Rate Limiting**: IP-based rate limiting on login and sensitive actions.
- **Secrets**: Environment variables are managed strictly; no secrets in the repository.

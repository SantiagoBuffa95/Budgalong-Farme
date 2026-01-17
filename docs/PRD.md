\# Budgalong System (Web-first) — PRD v0.1



\## Objetivo

Sistema completo para farms en NSW: onboarding de empleados, contratos, timesheets semanales, payroll semanal (payslips), leave balance, reportes y auditoría. Producto vendible como "sistema personalizado por farm" (sin premium features in-app).



\## Usuarios

\- Farm Owner / Admin (Tom): gestiona empleados, contratos, aprueba horas, ejecuta pay runs, reportes.

\- Employee: registra horas/actividades, ve payslips, ve leave balance.

\- Accountant (opcional): acceso solo lectura a reportes/payslips.



\## Alcance MVP (prioridad)

P0:

1\) Payroll semanal confiable (NSW + Pastoral Award baseline) y emisión de payslip.

2\) Contratos: generación y versionado (plantillas + parámetros).

3\) Calendario: public holidays NSW + local public holidays (si aplican) + observances (no-pay).

4\) Leave: anual leave balance visible (accrual por ordinary hours).



P1:

\- Reportes (semanal/mensual/anual).

\- Export CSV / Xero-ready.

\- Firma de contrato (simple e-sign).



\## Reglas base (fuentes oficiales)

\- NSW public holidays 2026 (incluye Australia Day 26 Jan 2026). Bank Holiday NO es public holiday. Local public holidays son public holiday “for work purposes” solo en esa zona. (Calendario debe soportar ambos). 

\- Annual leave: full-time y part-time acumulan 4 weeks/año basado en ordinary hours; casual no tiene paid annual leave.

\- Payslips: emitir dentro de 1 working day de pagar; incluir campos obligatorios.

\- Pastoral Award MA000035: overtime/penalties/allowances deben estar en un “Award Pack” versionado y actualizable.



\## “Contract Types” soportados

\- Full-time

\- Part-time

\- Casual

\- Salary (annual rate + ordinary hours + overtime settings)

\- Contractor (ABN): NO payslip; genera invoice/statement de horas (configurable). (Nota: no dar asesoría legal; dejar toggle “treat as employee” si corresponde)



\## Flujos

\### Onboarding

Admin crea empleado → invite por email → empleado setea password → completa perfil (visa opcional) → admin asigna contrato.



\### Timesheet

Empleado carga entradas diarias (start/end/break) + tipo de tarea → semana → submit → admin approve/adjust.



\### Pay Run

Admin ejecuta pay run semanal → motor calcula ordinary/overtime/allowances/super/deductions → genera payslip PDF → envía al empleado (email) + queda en portal.



\### Contract generation

Admin elige plantilla (award/role) → define parámetros → preview → employee accept → se congela versión del contrato.




\# Data Model v0.1 (Multi-tenant)



\## Core tables

farms

\- id (uuid)

\- name, abn, address, timezone (default Australia/Sydney)

\- created\_at



users

\- id (uuid)

\- farm\_id (uuid) \[nullable para super\_admin global]

\- email (unique within farm), password\_hash

\- role (enum)

\- is\_active

\- created\_at



employees

\- id (uuid)

\- farm\_id

\- user\_id (nullable si aún no aceptó invite)

\- legal\_name, preferred\_name, phone

\- employment\_status (enum)

\- start\_date, end\_date

\- ordinary\_hours\_per\_week (number)

\- created\_at



contracts

\- id (uuid)

\- farm\_id, employee\_id

\- type (full\_time/part\_time/casual/salary/contractor)

\- classification (e.g. Farm \& Livestock Hand level)

\- base\_rate\_hourly (nullable)

\- salary\_annual (nullable)

\- ordinary\_hours\_per\_week

\- overtime\_mode (enum: award\_default | included\_up\_to\_X | paid\_in\_addition)

\- allowances\_config (json)

\- deductions\_config (json)

\- award\_pack\_version (string)

\- status (draft/active/superseded)

\- created\_at



contract\_versions

\- id, contract\_id

\- version\_number

\- snapshot\_json (full contract snapshot)

\- accepted\_by\_employee\_at, accepted\_by\_admin\_at



timesheets

\- id, farm\_id, employee\_id

\- week\_start\_date, week\_end\_date

\- status (draft/submitted/approved/paid)

\- submitted\_at, approved\_at



timesheet\_entries

\- id, timesheet\_id

\- date, start\_time, end\_time, break\_minutes

\- task\_code (enum/string) \[para mapear a “feeding/watering” vs “other”]

\- notes



pay\_runs

\- id, farm\_id

\- period\_start, period\_end, pay\_date

\- status (draft/finalized)

\- created\_by



payslips

\- id, farm\_id, employee\_id, pay\_run\_id

\- gross, net, tax, super, allowances\_total, deductions\_total

\- pdf\_url

\- issued\_at



leave\_balances

\- id, farm\_id, employee\_id

\- annual\_leave\_hours

\- last\_accrual\_at



leave\_transactions

\- id, balance\_id

\- type (accrual/taken/adjustment)

\- hours

\- effective\_date

\- note



holiday\_calendar

\- id, farm\_id (nullable = default NSW)

\- date

\- name

\- type (public\_holiday | local\_public\_holiday | observance)

\- region\_code (e.g. NSW, or LGA)

\- multiplier\_policy\_ref (string)

\- source\_url (string)




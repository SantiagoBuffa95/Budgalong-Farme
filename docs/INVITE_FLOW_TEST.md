# Prueba Manual E2E: Flujo de Invitación de Empleado

Este documento guía paso a paso para verificar el funcionamiento correcto del sistema de invitación de empleados, desde la creación hasta el primer login.

## Prerrequisitos
1. Servidor corriendo: `npm run dev`
2. Base de datos con seed aplicado: `npx prisma db seed` (o usuario admin existente)

## Flujo de Prueba

### 1. Iniciar como Admin
- [ ] Navegar a `http://localhost:3000/admin/login`
- [ ] Ingresar credenciales de admin (ej. `admin@local.dev` / password del seed)
- [ ] Verificar redirección al Dashboard de Admin.

### 2. Crear Nuevo Empleado
- [ ] Ir a **Staff Management** (`/admin/staff`).
- [ ] Click en **"+ Add New Employee"**.
- [ ] Completar formulario:
  - **Legal Name**: "Juan Perez"
  - **Start Date**: (Hoy)
  - **Hours**: 38
- [ ] Click **"Create Employee"**.
- [ ] Verificar mensaje de éxito y redirección a la lista de Staff.
- [ ] Verificar que "Juan Perez" aparece en la lista con estado **"No Account"** (badge gris).

### 3. Generar Invitación
- [ ] En la fila de "Juan Perez", click en **"Send Invite"**.
- [ ] Verificar que el botón cambia a "Generating...".
- [ ] Verificar que aparece un recuadro con el link de invitación (ej. `http://localhost:3000/invite/f8a9...`).
- [ ] Click en **"Copy Link"**.
- [ ] (Opcional) Recargar página y verificar que el badge ahora dice **"Invite Sent"** (amarillo).

### 4. Aceptar Invitación (Como Empleado)
- [ ] **Abrir una ventana de Incógnito** (para no usar la sesión de admin).
- [ ] Pegar el link de invitación copiado.
- [ ] Verificar que carga la pantalla "Complete Your Registration" con el nombre "Juan Perez".
- [ ] Completar formulario:
  - **Email**: `juan.perez@test.com`
  - **Password**: `password123` (mínimo 8 caracteres)
  - **Confirm Password**: `password123`
- [ ] Click **"Activate Account"**.
- [ ] Verificar pantalla de éxito "Welcome to Budgalong!".

### 5. Login como Nuevo Empleado
- [ ] Click en **"Go to Login"** (o navegar a `/login/employee`).
- [ ] Ingresar:
  - **Email**: `juan.perez@test.com`
  - **Password**: `password123`
- [ ] Verificar redirección al **Employee Dashboard**.
- [ ] Verificar que no se tiene acceso a `/admin` (debería redirigir a `/employee` o dar error).

### 6. Verificar Estado Final (Como Admin)
- [ ] Volver a la ventana de Admin (Refrescar `/admin/staff`).
- [ ] Verificar que "Juan Perez" ahora tiene badge **"Active"** (verde).
- [ ] El botón de "Send Invite" ya no debería aparecer para este usuario.

## Puntos de Control de Errores (Edge Cases)

### Token Inválido/Expirado
- [ ] Intentar acceder a `/invite/token-falso`.
- [ ] Verificar mensaje de error "Invalid Invite".

### Passwords No Coinciden
- [ ] En el registro, poner passwords diferentes.
- [ ] Verificar mensaje de error.

### Password Corto
- [ ] Intentar password de 3 letras.
- [ ] Verificar validación (mínimo 8 caracteres).

---
**Resultado Esperado**: Todos los pasos deben completarse sin errores de servidor (500) ni de cliente.

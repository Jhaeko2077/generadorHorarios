# Como usar y probar Academic Timetable Optimizer

Este proyecto vive en `C:\Jeicob\generadorHorarios` y usa:

- Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL + OR-Tools CP-SAT.
- Frontend: Vite + React + TypeScript.
- Base de datos local: PostgreSQL con Docker.

## 1. Requisitos

Instala o verifica:

- Python 3.11 o superior.
- Node.js 18 o superior.
- Docker Desktop.
- PowerShell o terminal equivalente.

Para verificar:

```powershell
python --version
node --version
npm --version
docker --version
```

## 2. Levantar PostgreSQL

Desde la raiz del proyecto:

```powershell
cd C:\Jeicob\generadorHorarios
docker-compose up -d postgres
```

La base configurada es:

- Host: `localhost`
- Puerto: `5432`
- Usuario: `postgres`
- Password: `postgres`
- Base: `academic_scheduler`

## 3. Configurar y ejecutar backend

```powershell
cd C:\Jeicob\generadorHorarios\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python -m app.db.seed
python -m uvicorn app.main:app --reload
```

Backend:

- Healthcheck: `http://localhost:8000/health`
- API base: `http://localhost:8000/api`

Credenciales demo:

- Admin: `admin@example.com`
- Password: `admin123456`

Los docentes sembrados usan password:

- `teacher123456`

## 4. Ejecutar frontend

En otra terminal:

```powershell
cd C:\Jeicob\generadorHorarios\frontend
npm install
copy .env.example .env
npm run dev
```

Frontend:

- `http://localhost:5173`

## 5. Flujo demo recomendado

1. Abre `http://localhost:5173`.
2. Inicia sesion como admin:
   - `admin@example.com`
   - `admin123456`
3. Revisa datos academicos:
   - Terms
   - Programs
   - Cycles
   - Sections
   - Courses
   - Rooms
   - Time Slots
   - Course Offerings
4. Opcional: crea o elimina manual locks en `Manual Locks`.
5. Ve a `Generate`.
6. Usa:
   - Random seed: `42`
   - Max seconds: `20`
   - Candidate count: `3`
7. Si quieres, abre `Advanced optimization weights` y ajusta pesos.
8. Haz clic en `Generate Schedule with OR-Tools`.
9. Abre el detalle del schedule run.
10. Revisa:
    - Estado
    - Objective value
    - Soft penalty
    - Diversity score
    - Conflicts
    - Schedule by section / teacher / room
11. Publica el schedule si esta `optimal` o `feasible`.
12. Exporta Excel/PDF.
13. Inicia sesion como docente y revisa `My Schedule`.

## 6. Probar backend

Desde la raiz o desde `backend`:

```powershell
cd C:\Jeicob\generadorHorarios
python -m compileall backend\app
python -m ruff check backend\app
python -m pytest backend\app\tests -q
```

Resultado esperado:

- Compile sin errores.
- Ruff: `All checks passed!`
- Pytest: todos los tests pasan.

## 7. Probar frontend

```powershell
cd C:\Jeicob\generadorHorarios\frontend
npm run build
```

Resultado esperado:

- TypeScript compila.
- Vite genera `dist/` sin errores.

## 8. Si Docker no esta disponible

Si `docker` o `docker-compose` no existen en tu maquina, no podras validar migraciones ni seed contra PostgreSQL local. Instala Docker Desktop y repite:

```powershell
cd C:\Jeicob\generadorHorarios
docker-compose up -d postgres
cd backend
alembic upgrade head
python -m app.db.seed
```

## 9. Notas importantes

- No uses SQLite: el proyecto esta pensado para PostgreSQL.
- No guardes passwords en texto plano.
- Los manual locks son restricciones duras: si chocan con disponibilidad, sala, capacidad o turno, el solver debe reportar infeasibilidad.
- El directorio raiz todavia contiene una app legacy Next.js/Prisma (`src/`, `prisma/`, `next.config.ts`). Para este optimizador usa `backend/` y `frontend/`.

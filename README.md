# Academic Timetable Optimizer

MVP serio para generar horarios academicos de un instituto tecnico. Usa FastAPI, PostgreSQL, SQLAlchemy/Alembic, Google OR-Tools CP-SAT y un frontend Vite + React + TypeScript.

## Funciones principales

- Login JWT para administradores y docentes.
- Panel administrativo con gestion de docentes, periodos, programas, ciclos, secciones, cursos, aulas, bloques horarios, ofertas academicas y bloqueos manuales.
- Perfil docente editable y CRUD completo de disponibilidad.
- Generacion de horarios con OR-Tools CP-SAT, restricciones duras y penalizaciones suaves configurables.
- Diagnosticos legibles cuando el modelo es INFEASIBLE.
- Vistas de horario por seccion, docente y aula.
- Publicacion y borrado de ejecuciones de horario, con pagina `Mi horario` para docentes.
- Exportacion Excel/PDF, recomendaciones y auditoria.

## Arquitectura

```text
frontend/ React + TypeScript + Vite
  -> consume /api con token JWT
backend/ FastAPI
  -> SQLAlchemy 2.x + Alembic
  -> servicios de scheduling: data_loader, domain, solver, diagnostics, persistence
PostgreSQL
  -> datos academicos, ejecuciones, asignaciones, conflictos, auditoria
OR-Tools CP-SAT
  -> variables binarias x(sesion, bloque_inicio, aula)
```

## Como usa OR-Tools

Cada oferta academica se expande en sesiones. El solver crea variables booleanas solo para ubicaciones factibles: sesion, bloque inicial y aula.

Restricciones duras:

- Cada sesion se agenda exactamente una vez.
- Un docente, seccion o aula no puede tener dos clases en el mismo bloque atomico.
- La disponibilidad docente se respeta; si no hay disponibilidad, el docente se considera no disponible.
- La seccion respeta su turno.
- El aula debe ser compatible y tener capacidad suficiente.
- Se respetan maximos semanales, diarios y de bloques consecutivos.
- Los bloqueos manuales son restricciones duras.

Penalizaciones suaves:

- Bloques desaconsejados.
- Bloques no preferidos.
- Huecos de docente y seccion.
- Bloques tardios.
- Uso de laboratorios escasos cuando no es ideal.
- Repeticion respecto a terminos previos.
- Balance de carga.

INFEASIBLE significa que OR-Tools probo que no existe solucion con las restricciones duras actuales. No se debe ocultar relajando restricciones; hay que corregir datos, disponibilidad, aulas, turnos o bloqueos manuales. Los diagnosticos aparecen en la pagina `Generar horario` y en conflictos de la ejecucion.

## Instalacion local

Nota: la raiz contiene una app legacy Next.js/Prisma (`src/`, `prisma/`, `next.config.ts`, `.next/`, scripts raiz). Para este optimizador academico usa `backend/` y `frontend/`. Esos artefactos legacy estan documentados y no se eliminaron.

1. Levantar PostgreSQL:

```bash
docker-compose up -d postgres
```

2. Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload
```

3. Frontend:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:8000/health`

## Credenciales demo

Administrador:

- Email: `admin@example.com`
- Password: `admin123456`

Docentes demo, todos con password `teacher123456`:

- `ana.rojas@example.com`
- `luis.vega@example.com`
- `carmen.diaz@example.com`
- `marco.torres@example.com`
- `elena.ramos@example.com`
- `pedro.salas@example.com`

Si una base ya habia sido sembrada con emails antiguos, volver a ejecutar `python -m app.db.seed` actualiza de forma no destructiva esos emails y asegura la disponibilidad demo requerida.

## Flujo demo recomendado

1. Inicia sesion como admin.
2. Abre `Docentes` y revisa perfiles y disponibilidad.
3. Revisa cursos, secciones, aulas, bloques horarios y asignaciones.
4. Abre `Generar horario`.
5. Selecciona `2026-I Demo Term`.
6. Usa:

```text
random_seed = 42
max_seconds = 30
candidate_count = 1
respect_manual_locks = false
```

7. Haz clic en `Generar horario con OR-Tools`.
8. El resultado esperado para el seed demo corregido es `FEASIBLE` u `OPTIMAL`.
9. Abre la ejecucion para revisar asignaciones por seccion, docente y aula.
10. Publica una ejecucion factible/optima para que los docentes puedan verla en `Mi horario`.
11. Si quieres limpiar una corrida demo, abre la ejecucion y usa `Borrar horario`; se eliminan sus asignaciones, conflictos y publicacion asociada.

## Modulo Docentes

La ruta admin `/admin/teachers` permite:

- Listar docentes con nombre, email, codigo, tipo de contrato, rol, limites de carga y capacidades.
- Editar perfil docente.
- Gestionar disponibilidad de cualquier docente.
- Crear, editar y eliminar bloques de disponibilidad.

Tipos de disponibilidad:

- `preferred`: mejor horario.
- `available`: permitido.
- `discouraged`: permitido, pero el solver lo evita con penalizacion.
- `unavailable`: prohibido como restriccion dura.

Los docentes conservan su autoservicio en `Mi perfil`, `Mi disponibilidad` y `Mi horario`.

## Datos demo corregidos

La seccion `SD-C2-A` es de turno noche. Antes, Carmen Diaz y Marco Torres concentraban disponibilidad nocturna en martes/jueves, y Elena Ramos solo podia dictar `ETH101` jueves por la noche. Eso forzaba mas bloques el jueves de los que caben en el turno nocturno.

El seed ahora agrega a Carmen Diaz disponibilidad nocturna los lunes de `18:00` a `22:00` como `discouraged`. Esa franja sigue siendo realista porque el solver puede usarla con penalizacion, pero evita el cuello de botella sin debilitar restricciones duras.

## API principal

Todas las rutas viven bajo `/api`.

- Auth: `/auth/register-teacher`, `/auth/login`, `/auth/me`, `/auth/create-admin`.
- Docentes: `/teachers`, `/teachers/{id}`, `/teachers/{id}/profile`, `/teachers/{id}/availability`, `/me/teacher-profile`, `/me/availability`.
- Datos academicos: `/academic-terms`, `/programs`, `/cycles`, `/sections`, `/courses`, `/rooms`, `/time-slots`, `/course-offerings`.
- Horarios: `/schedule-runs/generate`, `/schedule-runs/{id}`, `/schedule-runs/{id}/assignments/by-section`, `/by-teacher`, `/by-room`, `/conflicts`, `/publish`, `DELETE /schedule-runs/{id}`.
- Recomendaciones: `/recommendations/course-offering/{course_offering_id}`.
- Exportaciones: `/exports/schedule-runs/{id}/excel`, `/exports/schedule-runs/{id}/pdf`.

## Pruebas

Backend:

```bash
python -m compileall backend\app
python -m ruff check backend\app
python -m pytest backend\app\tests -q
```

Frontend:

```bash
cd frontend
npm run build
```

Validacion con base local:

```bash
docker-compose up -d postgres
cd backend
alembic upgrade head
python -m app.db.seed
```

## Despliegue

El repo esta preparado para:

- Frontend Vite en Vercel usando `frontend/` como root directory y `frontend/vercel.json`.
- Backend FastAPI en Render usando `render.yaml`.
- PostgreSQL en Neon con `DATABASE_URL`; el backend acepta URLs Neon `postgresql://...` y las normaliza para `psycopg`.

Consulta `DEPLOYMENT.md` para los pasos completos y variables de entorno.

## Limitaciones MVP

- Las asignaciones docente-curso se definen antes de optimizar.
- Los bloques atomicos son de una hora.
- `weekly_hours` debe ser divisible por `session_duration_blocks`.
- No hay editor drag-and-drop todavia.
- Auth usa JWT simple, no OAuth.
- El modelado de huecos es una aproximacion compacta.
- Esta preparado para demo local, no para despliegue multi-campus grande.

## Futuras mejoras

- Editor visual drag-and-drop.
- Worker en background para corridas largas.
- Variables intervalo avanzadas de CP-SAT.
- Mejor modelado de huecos y descansos.
- Optimizacion de asignacion docente.
- Alternativas Pareto multiobjetivo.
- Simulaciones what-if.
- Restricciones de traslado multi-campus.
- Integracion con calendarios.
- Importacion/exportacion desde plantillas Excel.

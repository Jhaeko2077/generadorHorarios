# Despliegue

Esta guia prepara el despliegue sin tocar la app legacy Next.js/Prisma de la raiz. Para Academic Timetable Optimizer usa:

- Backend: `backend/`
- Frontend: `frontend/`
- Base de datos: PostgreSQL compatible, recomendado Neon

## 1. Neon PostgreSQL

1. Crea un proyecto en Neon.
2. Copia la cadena de conexion.
3. Puedes pegarla como `DATABASE_URL` aunque venga como `postgresql://...`; el backend la normaliza a `postgresql+psycopg://...`.
4. Asegurate de conservar `sslmode=require` si Neon lo incluye.

Ejemplo:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST/dbname?sslmode=require
```

## 2. Backend en Render

El archivo `render.yaml` ya describe un servicio Python usando `backend/` como raiz.

Variables requeridas en Render:

```text
DATABASE_URL=<url de Neon>
SECRET_KEY=<clave larga y privada>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
BACKEND_CORS_ORIGINS=https://tu-frontend.vercel.app,http://localhost:5173
```

Comandos configurados:

```text
Build: pip install -r requirements.txt
Start: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Despues del primer deploy ejecuta en la shell de Render:

```bash
alembic upgrade head
python -m app.db.seed
```

## 3. Frontend en Vercel

Configura el proyecto de Vercel con:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

El archivo `frontend/vercel.json` ya incluye la configuracion Vite y rewrite SPA.

Variable requerida en Vercel:

```text
VITE_API_BASE_URL=https://tu-backend.onrender.com/api
```

## 4. Verificacion rapida

1. Abre el frontend en Vercel.
2. Inicia sesion con `admin@example.com` / `admin123456`.
3. Entra a `Docentes` y confirma que aparecen los seis docentes demo.
4. En `Generar horario`, usa:

```text
random_seed = 42
max_seconds = 30
candidate_count = 1
respect_manual_locks = false
```

5. El resultado demo esperado es `FEASIBLE` u `OPTIMAL`.
6. Abre la ejecucion, exporta Excel/PDF, publica si deseas y prueba `Borrar horario` si quieres limpiar la corrida generada.

## Notas

- No publiques `SECRET_KEY`, tokens ni cadenas de conexion en GitHub.
- Si cambias el dominio de Vercel, actualiza `BACKEND_CORS_ORIGINS` en Render.
- Si `INFEASIBLE` aparece, revisa la lista de diagnosticos en la pagina de generacion antes de cambiar restricciones duras.

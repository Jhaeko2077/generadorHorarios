# Local Validation

Run these commands on a machine with Docker installed:

```powershell
docker-compose up -d postgres
cd backend
alembic upgrade head
python -m app.db.seed
python -m pytest app\tests -q
cd ..\frontend
npm run build
```

This environment does not currently have `docker` or `docker-compose` on PATH, so PostgreSQL migrations and seed data were not executed here.

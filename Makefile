.PHONY: db backend frontend migrate seed test

db:
	docker-compose up -d postgres

migrate:
	cd backend && alembic upgrade head

seed:
	cd backend && python -m app.db.seed

backend:
	cd backend && uvicorn app.main:app --reload

frontend:
	cd frontend && npm run dev

test:
	cd backend && pytest

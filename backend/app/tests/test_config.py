from app.core.config import Settings


def test_neon_postgres_url_is_normalized_for_psycopg() -> None:
    settings = Settings(database_url="postgresql://user:pass@example.neon.tech/app?sslmode=require")

    assert settings.database_url.startswith("postgresql+psycopg://")
    assert "sslmode=require" in settings.database_url

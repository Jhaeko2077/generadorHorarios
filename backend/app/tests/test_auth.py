from app.core.security import hash_password, verify_password


def test_password_is_not_stored_as_plaintext() -> None:
    password = "teacher123456"
    password_hash = hash_password(password)
    assert password_hash != password
    assert verify_password(password, password_hash)

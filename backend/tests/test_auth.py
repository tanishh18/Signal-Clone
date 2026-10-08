import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture
def client_with_db():
    engine = create_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_request_otp(client_with_db):
    res = client_with_db.post("/auth/request-otp", json={"identifier": "rahul"})
    assert res.status_code == 200
    data = res.json()
    assert data["otp"] == "123456"
    assert data["identifier"] == "rahul"


def test_register_success(client_with_db):
    payload = {
        "username": "rahul",
        "phone": "+919876543210",
        "display_name": "Rahul Sharma",
        "avatar_url": "https://avatar.example.com/rahul.png",
        "otp": "123456"
    }
    res = client_with_db.post("/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "rahul"
    assert data["user"]["display_name"] == "Rahul Sharma"
    assert data["user"]["is_online"] is True


def test_register_invalid_otp(client_with_db):
    payload = {
        "username": "ananya",
        "display_name": "Ananya Roy",
        "otp": "000000"
    }
    res = client_with_db.post("/auth/register", json=payload)
    assert res.status_code == 400
    assert "Invalid verification code" in res.json()["detail"]


def test_register_duplicate_username(client_with_db):
    payload = {
        "username": "vikram",
        "display_name": "Vikram Singh",
        "otp": "123456"
    }
    res1 = client_with_db.post("/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client_with_db.post("/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already taken" in res2.json()["detail"]


def test_login_success_by_username(client_with_db):
    # Register first
    client_with_db.post("/auth/register", json={
        "username": "priya",
        "phone": "+919876543211",
        "display_name": "Priya Nair",
        "otp": "123456"
    })

    # Login with username
    res = client_with_db.post("/auth/login", json={
        "identifier": "priya",
        "otp": "123456"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["username"] == "priya"


def test_login_success_by_phone(client_with_db):
    client_with_db.post("/auth/register", json={
        "username": "kavita",
        "phone": "+919999999999",
        "display_name": "Kavita Rao",
        "otp": "123456"
    })

    # Login with phone
    res = client_with_db.post("/auth/login", json={
        "identifier": "+919999999999",
        "otp": "123456"
    })
    assert res.status_code == 200
    assert res.json()["user"]["username"] == "kavita"


def test_login_invalid_otp(client_with_db):
    client_with_db.post("/auth/register", json={
        "username": "rohit",
        "display_name": "Rohit Verma",
        "otp": "123456"
    })

    res = client_with_db.post("/auth/login", json={
        "identifier": "rohit",
        "otp": "wrong_otp"
    })
    assert res.status_code == 400


def test_login_nonexistent_user(client_with_db):
    res = client_with_db.post("/auth/login", json={
        "identifier": "ghost_user",
        "otp": "123456"
    })
    assert res.status_code == 404


def test_get_me_protected_route(client_with_db):
    # Register to get token
    reg_res = client_with_db.post("/auth/register", json={
        "username": "dev",
        "display_name": "Dev Kapoor",
        "otp": "123456"
    })
    token = reg_res.json()["access_token"]

    # Access /auth/me with Bearer token
    res = client_with_db.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["username"] == "dev"

    # Access without token
    res_no_token = client_with_db.get("/auth/me")
    assert res_no_token.status_code == 401

    # Access with invalid token
    res_invalid_token = client_with_db.get("/auth/me", headers={"Authorization": "Bearer fake.token.here"})
    assert res_invalid_token.status_code == 401


def test_logout(client_with_db):
    reg_res = client_with_db.post("/auth/register", json={
        "username": "sam",
        "display_name": "Sam Altman",
        "otp": "123456"
    })
    token = reg_res.json()["access_token"]

    logout_res = client_with_db.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200
    assert logout_res.json()["message"] == "Logged out successfully."


def test_expired_token(client_with_db):
    from datetime import timedelta
    from app.auth import create_access_token
    
    # Create token already expired 1 hour ago
    expired_token = create_access_token({"sub": "1"}, expires_delta=timedelta(hours=-1))
    res = client_with_db.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()


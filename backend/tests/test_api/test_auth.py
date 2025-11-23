"""Tests for authentication endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(async_client: AsyncClient, test_user_data: dict):
    """Test user registration."""
    response = await async_client.post("/api/v1/auth/register", json=test_user_data)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == test_user_data["email"]
    assert data["first_name"] == test_user_data["first_name"]
    assert "id" in data
    assert "password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient, test_user_data: dict):
    """Test registration with duplicate email fails."""
    # Register first time
    response1 = await async_client.post("/api/v1/auth/register", json=test_user_data)
    assert response1.status_code == 201

    # Try to register again with same email
    response2 = await async_client.post("/api/v1/auth/register", json=test_user_data)
    assert response2.status_code == 400


@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient, test_user_data: dict):
    """Test successful login."""
    # Register user first
    await async_client.post("/api/v1/auth/register", json=test_user_data)

    # Login
    login_data = {
        "username": test_user_data["email"],
        "password": test_user_data["password"],
    }
    response = await async_client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(async_client: AsyncClient, test_user_data: dict):
    """Test login with wrong password fails."""
    # Register user
    await async_client.post("/api/v1/auth/register", json=test_user_data)

    # Try to login with wrong password
    login_data = {
        "username": test_user_data["email"],
        "password": "wrongpassword",
    }
    response = await async_client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user(async_client: AsyncClient, auth_headers: dict):
    """Test get current user endpoint."""
    response = await async_client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert "first_name" in data
    assert "password" not in data


@pytest.mark.asyncio
async def test_get_current_user_no_auth(async_client: AsyncClient):
    """Test get current user without authentication fails."""
    response = await async_client.get("/api/v1/auth/me")
    assert response.status_code == 401

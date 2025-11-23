"""Tests for health check endpoints."""

import pytest
from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "C3PO Backend API"
    assert "version" in data
    assert "docs" in data


def test_health_check(client: TestClient):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "unhealthy"]
    assert "version" in data
    assert "environment" in data
    assert "database" in data
    assert "redis" in data


def test_health_check_db(client: TestClient):
    """Test database health check endpoint."""
    response = client.get("/health/db")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data


def test_health_check_redis(client: TestClient):
    """Test Redis health check endpoint."""
    response = client.get("/health/redis")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "redis" in data

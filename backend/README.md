# C3PO Backend

FastAPI backend for the C3PO appointment scheduling system.

## Tech Stack

- **Python 3.12+** with modern async/await patterns
- **FastAPI** - Fast, modern web framework
- **PostgreSQL** - Primary database with asyncpg driver
- **Redis** - Caching and session management
- **SQLAlchemy 2.0** - Async ORM
- **Alembic** - Database migrations
- **uv** - Fast Python package manager
- **ruff** - Fast Python linter and formatter

## Features

- ✅ JWT Authentication (OAuth2 + JWT)
- ✅ User management with role-based access control (USER, STAFF, ADMIN)
- ✅ Appointment scheduling system
- ✅ PostgreSQL with async SQLAlchemy
- ✅ Redis for caching and refresh tokens
- ✅ Automatic API documentation (Swagger/ReDoc)
- ✅ Database migrations with Alembic
- ✅ Health check endpoints
- ✅ CORS configuration
- ✅ Rate limiting with slowapi
- ✅ Email notifications (FastAPI Mail)
- ✅ Redis caching for performance optimization

## Quick Start

### Prerequisites

- Python 3.12 or higher
- PostgreSQL 14+
- Redis 7+
- uv package manager (install with `pip install uv`)

### Installation

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   uv sync
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start PostgreSQL and Redis:**

   ```bash
   # Using Docker Compose (see docker-compose.yml in root)
   docker-compose up -d postgres redis
   ```

5. **Run database migrations:**

   ```bash
   uv run alembic upgrade head
   ```

6. **Start the development server:**
   ```bash
   uv run uvicorn app.main:app --reload
   ```

The API will be available at:

- **API:** http://localhost:8000
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Development Commands

```bash
# Start development server with auto-reload
uv run uvicorn app.main:app --reload

# Run linter (check only)
uv run ruff check .

# Run linter (check and fix)
uv run ruff check . --fix

# Run formatter
uv run ruff format .

# Type checking (optional)
uv run mypy app/

# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=app --cov-report=html

# Create new migration
uv run alembic revision --autogenerate -m "Description"

# Apply migrations
uv run alembic upgrade head

# Rollback migration
uv run alembic downgrade -1

# View migration history
uv run alembic history
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration (Pydantic Settings)
│   ├── database.py          # Database connection and session
│   ├── redis.py             # Redis client and utilities
│   ├── models/              # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py          # User model
│   │   └── appointment.py   # Appointment model
│   ├── schemas/             # Pydantic schemas (validation)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── appointment.py
│   │   └── auth.py
│   ├── api/                 # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── users.py         # User management
│   │   └── appointments.py  # Appointment management
│   ├── services/            # Business logic services
│   │   ├── __init__.py
│   │   ├── email.py         # Email service (future)
│   │   └── cache.py         # Cache service (future)
│   └── utils/               # Utility functions
│       ├── __init__.py
│       └── security.py      # Security utilities (JWT, passwords)
├── alembic/                 # Database migrations
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── tests/                   # Test suite
│   ├── __init__.py
│   ├── conftest.py
│   └── test_api/
├── .env.example             # Example environment variables
├── .gitignore
├── alembic.ini              # Alembic configuration
├── pyproject.toml           # Project dependencies and config
├── ruff.toml                # Ruff linter configuration
└── README.md
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with OAuth2 form
- `POST /api/v1/auth/login/json` - Login with JSON body
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (invalidate tokens)
- `GET /api/v1/auth/me` - Get current user profile

### Users

- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update current user
- `GET /api/v1/users/{user_id}` - Get user by ID (admin only)
- `GET /api/v1/users/` - List all users (admin only)

### Appointments

- `POST /api/v1/appointments/` - Create appointment
- `GET /api/v1/appointments/` - List user's appointments
- `GET /api/v1/appointments/{id}` - Get appointment by ID
- `PATCH /api/v1/appointments/{id}` - Update appointment
- `DELETE /api/v1/appointments/{id}` - Delete appointment

### Health Checks

- `GET /health` - Overall health status
- `GET /health/db` - Database connection status
- `GET /health/redis` - Redis connection status

## Environment Variables

See `.env.example` for all available configuration options.

### Important Settings

- `SECRET_KEY` - **MUST** be changed in production (use `openssl rand -hex 32`)
- `POSTGRES_PASSWORD` - Database password
- `REDIS_PASSWORD` - Redis password (if enabled)
- `MAIL_USERNAME` / `MAIL_PASSWORD` - Email credentials for notifications

## Database Migrations

### Creating Migrations

```bash
# Auto-generate migration from model changes
uv run alembic revision --autogenerate -m "Add user table"

# Create empty migration (manual)
uv run alembic revision -m "Add custom index"
```

### Applying Migrations

```bash
# Apply all pending migrations
uv run alembic upgrade head

# Apply specific number of migrations
uv run alembic upgrade +2

# Rollback one migration
uv run alembic downgrade -1

# Rollback to specific revision
uv run alembic downgrade <revision_id>
```

## Authentication Flow

1. **Register:** `POST /api/v1/auth/register` with user details
2. **Login:** `POST /api/v1/auth/login` with email/password
   - Returns `access_token` (JWT, 30min) and `refresh_token` (UUID, 7 days)
3. **API Requests:** Include `Authorization: Bearer <access_token>` header
4. **Refresh Token:** `POST /api/v1/auth/refresh` before access token expires
5. **Logout:** `POST /api/v1/auth/logout` to invalidate tokens

## Testing

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=app --cov-report=term-missing

# Run specific test file
uv run pytest tests/test_api/test_auth.py

# Run specific test
uv run pytest tests/test_api/test_auth.py::test_register_user
```

## Caching Strategy

The backend uses Redis for caching to improve performance and reduce database load.

### What is Cached

**User Data** (`app/utils/security.py`, `app/api/users.py`):

- `get_current_user()` - **TTL: 5 minutes**
  - Called on every authenticated request
  - Reduces DB queries by 10-20x
- `read_user()` - **TTL: 5 minutes**
  - Admin endpoint for fetching users

**Appointments** (`app/api/appointments.py`):

- `read_appointments()` - **TTL: 1 minute**
  - List endpoint with pagination support
  - Shorter TTL because appointments change frequently

### Cache Invalidation

Caches are automatically invalidated when data changes:

**User Updates:**

```python
# app/api/users.py
await cache_service.delete(f"user:{user_id}")
```

**Appointment Operations:**

```python
# Create, Update, Delete
await cache_service.clear_pattern(f"appointments:user:{user_id}:*")
```

### TTL Reasoning

| Data Type    | TTL       | Reason                                      |
| ------------ | --------- | ------------------------------------------- |
| Users        | 5 minutes | Changes rarely (email, profile updates)     |
| Appointments | 1 minute  | Changes frequently (create, update, cancel) |

**Trade-offs:**

- ⬆️ Higher TTL = Less DB load, but potentially stale data
- ⬇️ Lower TTL = Fresh data, but more DB queries

### Cache Keys Format

```
user:{user_id}                                         # Single user
appointments:user:{user_id}:skip:{skip}:limit:{limit}  # Appointments list
```

### Performance Impact

**Expected improvements:**

| Endpoint             | Without Cache | With Cache | Speedup       |
| -------------------- | ------------- | ---------- | ------------- |
| `GET /auth/me`       | ~100-200ms    | ~5-10ms    | **10-20x** 🚀 |
| `GET /appointments/` | ~50-100ms     | ~5ms       | **10-20x** 🚀 |
| `GET /users/{id}`    | ~80-150ms     | ~5ms       | **15-30x** 🚀 |

### CacheService API

```python
from app.services.cache import cache_service

# Get from cache
value = await cache_service.get("my_key")

# Set with expiration (seconds)
await cache_service.set("my_key", {"data": "value"}, expire=60)

# Delete
await cache_service.delete("my_key")

# Clear pattern (e.g., all user appointments)
await cache_service.clear_pattern("appointments:user:123:*")

# Check existence
exists = await cache_service.exists("my_key")

# Get TTL
ttl = await cache_service.get_ttl("my_key")
```

## Deployment

See `docs/backend-plan.md` for detailed deployment instructions including:

- Docker/Docker Compose setup
- CI/CD pipeline examples
- Production environment configuration
- Security considerations

## License

MIT

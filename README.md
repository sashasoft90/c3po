# C3PO - Appointment Scheduling System

Full-stack appointment scheduling application built with SvelteKit (frontend) and FastAPI (backend).

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and **pnpm** 10.19.0+
- **Python** 3.12+ and **uv**
- **Docker Desktop** (for PostgreSQL and Redis)

### 1. Start Docker Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify containers are running
docker ps
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
uv sync

# Copy environment file
cp .env.example .env

# Run database migrations
uv run alembic upgrade head

# Start backend server (http://localhost:8000)
uv run uvicorn app.main:app --reload
```

### 3. Setup Frontend

```bash
# Install dependencies
pnpm install

# Start dev server (http://localhost:5173)
pnpm dev
```

## 📦 Commands

### Frontend

```bash
pnpm dev              # Development server
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm check            # Type checking
pnpm lint             # Linting
pnpm format           # Code formatting
pnpm test             # Unit tests (watch mode)
pnpm test:e2e         # E2E tests
```

### Backend

```bash
cd backend

# Development
uv run uvicorn app.main:app --reload

# Database migrations
uv run alembic revision --autogenerate -m "Description"
uv run alembic upgrade head

# Code quality
uv run ruff check .
uv run ruff format .

# Testing
uv run pytest
```

## 🏗️ Tech Stack

### Frontend

- **SvelteKit** + **Svelte 5** - UI framework с новыми runes
- **TypeScript** - Type safety
- **Feature-Sliced Design** - Architecture methodology
- **TailwindCSS v4** - Styling
- **shadcn-svelte** - UI components
- **Vitest** + **Playwright** - Testing (unit + E2E)

### Backend

- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Database with asyncpg driver
- **Redis** - Caching and session management
- **SQLAlchemy 2.0** - Async ORM
- **Alembic** - Database migrations
- **uv** - Fast Python package manager
- **JWT** - Authentication

## 📚 Documentation

- [**CLAUDE.md**](./CLAUDE.md) - Project guidelines for Claude Code AI
- [**Backend Plan**](./docs/backend-plan.md) - Detailed backend architecture
- [**Backend README**](./backend/README.md) - Backend setup and API docs

## 🔌 API Endpoints

- **Backend API:** http://localhost:8000
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Authentication

- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Current user

### Appointments

- `POST /api/v1/appointments/` - Create appointment
- `GET /api/v1/appointments/` - List appointments
- `PATCH /api/v1/appointments/{id}` - Update appointment

## 🐳 Docker

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f postgres redis
```

## 🔗 Path Aliases

```typescript
@/*  →  src/lib/*
```

## 📄 License

Private project.

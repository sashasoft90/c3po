# Backend Plan: FastAPI + PostgreSQL + Redis (Modern Stack)

## Инструменты

- **Python 3.12+** (или 3.13)
- **uv** — быстрый пакетный менеджер (замена pip/poetry)
- **ruff** — линтер и форматтер (замена black/flake8/isort)

## Структура проекта

**Flat Layout** - backend использует плоскую структуру, так как `src/` занят SvelteKit фронтендом.

```
c3po/
├── src/                     # SvelteKit (фронтенд)
│   └── lib/
│       ├── app/
│       ├── pages/
│       ├── widgets/
│       ├── features/
│       └── ...
│
└── backend/
    ├── pyproject.toml       # uv + ruff конфигурация (package = false)
    ├── uv.lock              # Lock-файл зависимостей
    ├── .python-version      # Версия Python (3.12 или 3.13)
    ├── ruff.toml            # Настройки ruff
    ├── app/                 # Python код (без src/)
    │   ├── __init__.py
    │   ├── main.py          # FastAPI приложение
    │   ├── config.py        # Pydantic Settings
    │   ├── database.py      # PostgreSQL (asyncpg)
    │   ├── redis.py         # Redis клиент
    │   ├── models/          # SQLAlchemy модели
    │   │   ├── __init__.py
    │   │   ├── user.py
    │   │   └── appointment.py
    │   ├── schemas/         # Pydantic схемы
    │   │   ├── __init__.py
    │   │   ├── user.py
    │   │   └── appointment.py
    │   ├── api/
    │   │   ├── __init__.py
    │   │   ├── auth.py      # Регистрация/логин
    │   │   ├── users.py     # CRUD пользователей
    │   │   └── appointments.py  # CRUD записей
    │   ├── services/
    │   │   ├── __init__.py
    │   │   ├── email.py     # Рассылка emails
    │   │   └── cache.py     # Redis кеширование
    │   └── utils/
    │       ├── __init__.py
    │       └── security.py  # JWT, bcrypt
    ├── alembic/             # Миграции БД
    │   ├── env.py
    │   └── versions/
    ├── tests/               # Тесты (pytest)
    │   ├── __init__.py
    │   ├── conftest.py
    │   └── test_api/
    ├── .env
    └── Dockerfile
```

## Команды разработки

```bash
# Установка
uv sync

# Запуск
uv run uvicorn app.main:app --reload

# Линтинг и форматирование
uv run ruff check .
uv run ruff format .

# Миграции
uv run alembic upgrade head

# Тесты
uv run pytest
```

## Зависимости (pyproject.toml)

```toml
[project]
name = "c3po-backend"
version = "0.1.0"
requires-python = ">=3.12"

dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.32",
    "sqlalchemy[asyncio]>=2.0",
    "asyncpg>=0.30",
    "redis>=5.0",
    "alembic>=1.14",
    "python-jose[cryptography]>=3.3",
    "passlib[bcrypt]>=1.7",
    "fastapi-mail>=1.4",
    "arq>=0.26",
    "pydantic-settings>=2.6",
]

[tool.uv]
package = false  # Отключаем src layout (используем flat layout)

[tool.ruff]
target-version = "py312"
line-length = 120

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM"]
```

## Ключевые компоненты

### 1. Аутентификация (OAuth2 + JWT)

- **OAuth2 Password Flow** - стандартный протокол для логина/регистрации
- **Access Token (JWT)** - короткоживущий токен (15-30 мин) для API запросов
- **Refresh Token** - долгоживущий токен (7-30 дней), хранится в Redis
- **Хеширование паролей** через bcrypt
- **Token blacklist** в Redis для logout
- **Rate limiting** через Redis для защиты от брутфорса

Схема работы:

```http request
# 1. Логин (OAuth2)
POST /auth/login
→ Проверка пароля
→ Выдача access_token (JWT) + refresh_token (в Redis)

# 2. Запросы к API
GET /users/me
Authorization: Bearer <access_token>

# 3. Обновление токена
POST /auth/refresh
→ Проверка refresh_token в Redis
→ Выдача нового access_token

# 4. Logout
POST /auth/logout
→ Добавление токена в blacklist (Redis)
```

### 2. База данных (PostgreSQL)

- SQLAlchemy 2.0 с async поддержкой
- asyncpg драйвер
- Alembic для миграций

### 3. Redis

- Кеширование данных
- Хранение сессий/refresh токенов
- Rate limiting
- Очередь задач для email (arq)

### 4. Email рассылка

- fastapi-mail для отправки
- Фоновые задачи через arq + Redis
- Шаблоны писем (Jinja2)

## Docker Compose

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: c3po
      POSTGRES_USER: c3po
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  worker:
    build: ./backend
    command: uv run arq app.services.email.WorkerSettings
    depends_on:
      - redis

volumes:
  postgres_data:
  redis_data:
```

## Дополнительные компоненты и соображения

### CORS (критично для dev и prod)

```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Временные зоны

- Хранение всех дат в UTC (PostgreSQL `timestamptz`)
- Конвертация в локальную зону на фронтенде
- Библиотека: `zoneinfo` (встроенная в Python 3.9+)
- SQLAlchemy: `DateTime(timezone=True)`

### Система уведомлений

**Email (обязательно):**

- Подтверждение регистрации (с токеном активации)
- Подтверждение записи на приём
- Напоминание за 24/1 час до приёма (через arq scheduler)
- Отмена записи

**Опционально:**

- SMS через Twilio (для критичных напоминаний)
- Push-уведомления в браузере (Web Push API)
- WebSocket для real-time уведомлений

### Бизнес-логика записей

**Требует проработки:**

- [ ] Кто может создавать слоты? (админ/врач/мастер)
- [ ] Публичная запись или только после регистрации?
- [ ] Политика отмены (за сколько часов, штрафы?)
- [ ] Повторяющиеся записи (recurring appointments)
- [ ] Защита от двойного бронирования (race conditions)
- [ ] Статусы записи: `pending`, `confirmed`, `cancelled`, `completed`, `no_show`

### Роли и права доступа (RBAC)

```python
# Минимальный набор ролей:
class UserRole(enum.Enum):
    USER = "user"              # Обычный пользователь (запись на приём)
    STAFF = "staff"            # Специалист/врач/мастер
    ADMIN = "admin"            # Администратор

# Права доступа:
# - USER: создание/отмена своих записей, просмотр профиля
# - STAFF: управление слотами, просмотр своих записей
# - ADMIN: полный доступ
```

Зависимости: `fastapi-users` или самописная система с декораторами

### Логирование и мониторинг

```toml
# pyproject.toml - дополнительные зависимости
dependencies = [
    # ... существующие ...
    "loguru>=0.7",           # Простое и красивое логирование
    "sentry-sdk[fastapi]>=2.0",  # Отслеживание ошибок
    "prometheus-fastapi-instrumentator>=7.0",  # Метрики
]
```

**Настройка loguru:**

```python
# app/logging_config.py
from loguru import logger
import sys
from app.config import settings

def setup_logging():
    # Удаляем дефолтный handler
    logger.remove()

    # Development: красивый цветной вывод
    if settings.ENVIRONMENT == "development":
        logger.add(
            sys.stderr,
            level="DEBUG",
            format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>"
        )

    # Production: JSON для анализа + ротация файлов
    else:
        logger.add(
            "logs/app.log",
            rotation="500 MB",
            retention="10 days",
            level="INFO",
            serialize=True,  # JSON format
            backtrace=True,
            diagnose=True
        )

# app/main.py
from app.logging_config import setup_logging
from loguru import logger

setup_logging()

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    logger.info("Fetching user", user_id=user_id)
    # ... логика
    logger.debug("User found", user_id=user_id, username="john")
```

**Health Check endpoints:**

```python
GET /health        # Базовая проверка
GET /health/db     # Проверка PostgreSQL
GET /health/redis  # Проверка Redis
```

### Тестирование

```
backend/tests/
├── conftest.py              # Фикстуры pytest
├── unit/
│   ├── test_models.py
│   ├── test_schemas.py
│   └── test_utils.py
├── integration/
│   ├── test_auth_api.py
│   ├── test_appointments_api.py
│   └── test_email_service.py
└── e2e/                     # E2E с Playwright (опционально)
```

Зависимости:

```toml
[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
    "pytest-cov>=6.0",
    "httpx>=0.27",           # Тестовый клиент для FastAPI
    "faker>=30.0",           # Генерация тестовых данных
]
```

Цель: **80%+ coverage**

### Безопасность

**Уже включено:**

- JWT токены с истечением
- Bcrypt для паролей
- SQLAlchemy ORM (защита от SQL injection)
- FastAPI автоматически экранирует XSS

**Нужно добавить:**

- **Rate Limiting** через Redis:
  ```python
  # slowapi или fastapi-limiter
  @limiter.limit("5/minute")
  async def login(...):
      ...
  ```
- **HTTPS** (Let's Encrypt в продакшене)
- **CSRF токены** (если используете cookies)
- **Helmet-подобные заголовки** (CSP, X-Frame-Options)

Зависимости:

```toml
dependencies = [
    # ...
    "slowapi>=0.1.9",        # Rate limiting
]
```

### API Versioning

```python
# Структура URL:
/api/v1/auth/login
/api/v1/users/
/api/v1/appointments/

# app/main.py
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
```

### CI/CD Pipeline

```yaml
# .github/workflows/backend.yml (пример)
name: Backend CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - run: cd backend && uv sync
      - run: cd backend && uv run pytest
      - run: cd backend && uv run ruff check .

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: # ... ваш деплой скрипт
```

### Документация

**Автоматическая (из коробки FastAPI):**

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

**Ручная:**

- `backend/README.md` - инструкции для разработчиков
- `docs/api.md` - описание бизнес-логики для фронтенда

## Дальнейшие идеи (Nice to have)

- [ ] WebSocket для real-time уведомлений
- [ ] Internationalization (i18n) - мультиязычность
- [ ] Audit log - история изменений (кто, когда, что изменил)
- [ ] Export данных (GDPR right to data portability)
- [ ] Admin панель (FastAPI Admin или custom)
- [ ] GraphQL API (Strawberry) как альтернатива REST

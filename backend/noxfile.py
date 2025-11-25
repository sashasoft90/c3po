"""Nox sessions for development tasks.

All sessions use venv_backend="none" to run in the current environment.
Make sure to run 'uv sync --extra dev' first to install all dependencies.
"""

import nox

# Use current environment for all sessions (fast development workflow)
nox.options.default_venv_backend = "uv|virtualenv"


@nox.session(name="seed")
def seed_database(session: nox.Session) -> None:
    """Seed database with test data."""
    session.run("uv", "run", "python", "-m", "scripts.seed")


@nox.session(name="test")
def run_tests(session: nox.Session) -> None:
    """Run tests with pytest."""
    session.run("uv", "run", "pytest")


@nox.session(name="lint")
def lint_code(session: nox.Session) -> None:
    """Run ruff linter."""
    session.run("ruff", "check", ".")


@nox.session(name="format")
def format_code(session: nox.Session) -> None:
    """Format code with ruff."""
    session.run("ruff", "format", ".")


@nox.session(name="migrate")
def run_migrations(session: nox.Session) -> None:
    """Run database migrations."""
    session.run("alembic", "upgrade", "head")

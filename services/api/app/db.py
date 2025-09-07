from __future__ import annotations
import os
from typing import Iterator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session

# SQLAlchemy 2.x base
class Base(DeclarativeBase):
    pass

def get_database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        # Local dev (docker-compose Postgres)
        # IMPORTANT: use psycopg3 driver
        url = "postgresql+psycopg://postgres:postgres@localhost:5432/app"
    return url

ENGINE = create_engine(get_database_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, autocommit=False)

def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

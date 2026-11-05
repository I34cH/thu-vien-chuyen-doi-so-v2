"""Engine, phiên làm việc và dependency get_db."""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """Cấp một phiên CSDL cho mỗi request và đóng khi xong."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

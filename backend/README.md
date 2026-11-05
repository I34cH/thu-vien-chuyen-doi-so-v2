# Backend (FastAPI)

Cấu hình đọc từ `../.env` (DATABASE_URL, JWT_SECRET, CORS_ORIGINS).

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows
# Chạy server (cổng 8000)
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
# Kiểm thử
.venv/Scripts/python -m pytest -q
# Migration
.venv/Scripts/python -m alembic upgrade head
.venv/Scripts/python -m alembic current
.venv/Scripts/python -m alembic revision --autogenerate -m "mo ta"
```

Kiểm tra nhanh: `curl http://localhost:8000/api/health`.

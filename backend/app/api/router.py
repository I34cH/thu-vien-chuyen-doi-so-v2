"""Router gốc, tiền tố /api."""
from fastapi import APIRouter

from app.api.routes import auth, health, muon, quan_ly, thong_ke, tra_cuu

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(tra_cuu.router, tags=["tra cứu"])
api_router.include_router(muon.router, tags=["mượn"])
api_router.include_router(quan_ly.router, tags=["quản lý"])
api_router.include_router(thong_ke.router, tags=["thống kê"])

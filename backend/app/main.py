"""Điểm vào FastAPI."""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings

app = FastAPI(title="Thư viện chuyển đổi số v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def loi_du_lieu(_: Request, loi: RequestValidationError):
    """Dữ liệu vào sai -> 400 {"detail": "..."} (theo docs/API.md), thay cho 422 mặc định."""
    chi_tiet = "; ".join(
        f"{'.'.join(str(p) for p in e['loc'] if p not in ('body', 'query', 'path', 'form'))}: {e['msg']}"
        for e in loi.errors()
    )
    return JSONResponse(status_code=400, content={"detail": f"Dữ liệu không hợp lệ: {chi_tiet}"})


app.include_router(api_router)

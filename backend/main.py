from pathlib import Path

import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import uvicorn

from backend.app.routes import products, orders
from backend.config import get_settings
from backend.app.database.db import engine, Base

settings = get_settings()


async def init_db_if_needed() -> None:
    # Для SQLite: создаём файл и таблицы, если БД ещё не существует
    if settings.DATABASE_URL.startswith("sqlite"):
        db_path = settings.DATABASE_URL.split("///", 1)[1]
        path = Path(db_path)
        if not path.exists():
            # синхронное создание таблиц поверх async engine
            from sqlalchemy import create_engine

            sync_url = settings.DATABASE_URL.replace("+aiosqlite", "")
            sync_engine = create_engine(sync_url, future=True)
            Base.metadata.create_all(bind=sync_engine)
            sync_engine.dispose()


# при импорте модуля (старте приложения) гарантируем наличие таблиц
asyncio.run(init_db_if_needed())

app = FastAPI(
    title="Vape Shop API",
    description="Telegram Mini App для vape-магазина",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app.mount(
    "/static",
    StaticFiles(directory=str(FRONTEND_DIR)),
    name="static",
)


@app.get("/app", response_class=HTMLResponse)
async def serve_app():
    with open(FRONTEND_DIR / "index.html", "r", encoding="utf-8") as f:
        html = f.read()
    html = html.replace('href="css/', 'href="/static/css/').replace(
        'src="js/', 'src="/static/js/'
    )
    return html


@app.get("/admin", response_class=HTMLResponse)
async def serve_admin():
    with open(FRONTEND_DIR / "admin.html", "r", encoding="utf-8") as f:
        html = f.read()
    html = html.replace('href="css/', 'href="/static/css/').replace(
        'src="js/', 'src="/static/js/'
    )
    return html


@app.get("/")
async def root():
    return {"message": "🚀 Vape Shop API работает!", "status": "OK"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "vape-shop-api"}


@app.get("/api/v1")
async def api_info():
    return {
        "name": "Vape Shop API",
        "version": "1.0.0",
        "endpoints": ["/", "/health", "/api/v1"],
        "docs": "/docs",
    }


app.include_router(products.router)
app.include_router(orders.router)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

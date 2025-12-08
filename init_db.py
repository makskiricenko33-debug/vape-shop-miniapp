import asyncio

from backend.app.database.db import engine, Base
from backend.app.models import *  # noqa: F401


async def init_models():
    print("▶ starting init_models")
    try:
        async with engine.begin() as conn:
            print("▶ connected to DB, creating tables...")
            await conn.run_sync(Base.metadata.create_all)
        print("✅ tables created")
    except Exception as e:
        print("❌ error:", repr(e))


if __name__ == "__main__":
    asyncio.run(init_models())

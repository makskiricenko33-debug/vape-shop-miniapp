import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.db import async_session
from backend.app.models.product import Product


async def seed_products():
    async with async_session() as db:  # type: AsyncSession
        items = [
            Product(
                name="Ягодный микс",
                description="Сладкая смесь лесных ягод",
                price=70000,  # 700 ₽
                strength=20,
                volume_ml=30,
            ),
            Product(
                name="Манго лёд",
                description="Холодный манго с лёгким кулером",
                price=75000,
                strength=20,
                volume_ml=30,
            ),
            Product(
                name="Арбуз мята",
                description="Свежий арбуз с мятой",
                price=65000,
                strength=15,
                volume_ml=30,
            ),
            Product(
                name="Табак классический",
                description="Классический табачный вкус",
                price=80000,
                strength=35,
                volume_ml=30,
            ),
            Product(
                name="Кола лайм",
                description="Газированная кола с лаймом",
                price=69000,
                strength=20,
                volume_ml=30,
            ),
        ]

        db.add_all(items)
        await db.commit()
        print("✅ seeded products:", len(items))


if __name__ == "__main__":
    asyncio.run(seed_products())

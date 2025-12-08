from sqlalchemy import String, Integer, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.database.db import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[int] = mapped_column(Integer, nullable=False)  # в копейках
    strength: Mapped[int | None] = mapped_column(Integer, nullable=True)  # крепость, мг
    volume_ml: Mapped[int | None] = mapped_column(Integer, nullable=True)  # объём
    is_active: Mapped[bool] = mapped_column(default=True)

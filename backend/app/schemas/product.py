from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    description: str | None = None
    price: int
    strength: int | None = None
    volume_ml: int | None = None
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: int

    class Config:
        from_attributes = True

from datetime import datetime
from pydantic import BaseModel

class OrderListItem(BaseModel):
    id: int
    created_at: datetime
    status: str
    customer_name: str | None = None

    class Config:
        from_attributes = True


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = 1


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemRead(OrderItemBase):
    id: int

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]
    customer_name: str | None = None


class OrderRead(BaseModel):
    id: int
    created_at: datetime
    status: str
    customer_name: str | None = None
    items: list[OrderItemRead]

    class Config:
        from_attributes = True

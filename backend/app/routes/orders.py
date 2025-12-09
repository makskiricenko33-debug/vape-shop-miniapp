from typing import List

from sqlalchemy.orm import selectinload
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.database.db import get_db
from backend.app.models.order import Order, OrderItem
from backend.app.models.product import Product
from backend.app.schemas.order import (
    OrderCreate,
    OrderRead,
    OrderListItem,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderCreate, db: AsyncSession = Depends(get_db)):
    if not payload.items:
        raise HTTPException(
            status_code=400,
            detail="Order must contain at least one item",
        )

    product_ids = {item.product_id for item in payload.items}
    stmt = select(Product.id).where(Product.id.in_(product_ids))
    result = await db.execute(stmt)
    existing_ids = set(result.scalars().all())
    if existing_ids != product_ids:
        raise HTTPException(status_code=400, detail="Some products do not exist")

    order = Order(
        customer_name=payload.customer_name,
        phone=payload.phone,
        city=payload.city,
        status="new",
    )
    db.add(order)
    await db.flush()

    for item in payload.items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
            )
        )

    await db.commit()

    stmt = (
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.items))
    )
    result = await db.execute(stmt)
    order = result.scalar_one()
    return order


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/", response_model=List[OrderListItem])
async def list_orders(db: AsyncSession = Depends(get_db)):
    stmt = select(Order).order_by(Order.created_at.desc())
    result = await db.execute(stmt)
    orders = result.scalars().all()
    return orders


@router.patch("/{order_id}/status", response_model=OrderRead)
async def update_order_status(
    order_id: int,
    status_value: str,
    db: AsyncSession = Depends(get_db),
):
    allowed = {"new", "paid", "shipped", "cancelled"}
    if status_value not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed: {', '.join(allowed)}",
        )

    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status_value
    await db.commit()
    await db.refresh(order)
    return order

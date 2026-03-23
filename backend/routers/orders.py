from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List

from database import get_db
from models import User, Asset, Purchase, Transaction
from auth import get_current_user

router = APIRouter(prefix="/api/orders", tags=["orders"])

class CheckoutRequest(BaseModel):
    asset_ids: List[int]

class CheckoutResponse(BaseModel):
    status: str
    message: str

@router.post("/checkout", response_model=CheckoutResponse)
async def checkout(req: CheckoutRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not req.asset_ids:
        raise HTTPException(status_code=400, detail="Корзина пуста")
        
    stmt = select(Asset).where(Asset.id.in_(req.asset_ids))
    result = await db.execute(stmt)
    assets = result.scalars().all()
    
    if len(assets) != len(req.asset_ids):
        raise HTTPException(status_code=400, detail="Некоторые товары не найдены")
        
    total_price = sum(a.price for a in assets)
    
    # Refresh user to get latest balance
    await db.refresh(current_user)
    
    if current_user.balance < total_price:
        raise HTTPException(status_code=400, detail="Недостаточно средств на балансе. Пожалуйста, пополните баланс.")
        
    # Deduct balance
    current_user.balance -= total_price
    
    # Record transaction
    txn = Transaction(user_id=current_user.id, amount=-total_price, type="purchase", status="completed")
    db.add(txn)
    
    # Record purchases
    for asset in assets:
        purchase = Purchase(user_id=current_user.id, asset_id=asset.id, price_paid=asset.price)
        db.add(purchase)
        
    await db.commit()
    
    return CheckoutResponse(status="success", message="Оплата прошла успешно!")

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Dict, Any

from database import get_db
from models import User, Asset, Purchase, Transaction
from auth import get_current_user
from schemas import UserUpdate, UserResponse

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    req: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if req.name is not None: current_user.name = req.name
    if req.email is not None: current_user.email = req.email
    if req.avatar is not None: current_user.avatar = req.avatar
    if req.bio is not None: current_user.bio = req.bio
    if req.social_links is not None: current_user.social_links = req.social_links
    
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.get("/me/dashboard")
async def get_my_dashboard(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch user's purchases
    p_result = await db.execute(
        select(Purchase).where(Purchase.user_id == current_user.id)
    )
    purchases = p_result.scalars().all()
    
    # 2. Fetch user's uploaded assets
    a_result = await db.execute(
        select(Asset).where(Asset.author_id == current_user.id)
    )
    my_assets = a_result.scalars().all()
    
    # 3. Fetch user's transactions
    t_result = await db.execute(
        select(Transaction).where(Transaction.user_id == current_user.id).order_by(Transaction.created_at.desc())
    )
    transactions = t_result.scalars().all()
    
    # 4. Calculate stats
    # Total sales of user's assets
    sales_count = 0
    for asset in my_assets:
        s_res = await db.execute(
            select(func.count(Purchase.id)).where(Purchase.asset_id == asset.id)
        )
        sales_count += s_res.scalar()
        
    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "balance": current_user.balance,
            "avatar": current_user.avatar,
            "bio": current_user.bio,
            "social_links": current_user.social_links,
            "is_creator": current_user.is_creator
        },
        "stats": {
            "purchase_count": len(purchases),
            "asset_count": len(my_assets),
            "transaction_count": len(transactions),
            "sales_count": sales_count,
            "rating": 4.9 # Mock for now
        },
        "recent_purchases": [
            {
                "id": p.id,
                "asset_id": p.asset_id,
                "price": p.price_paid,
                "date": p.created_at.strftime("%d %b") if p.created_at else "Недавно"
            } for p in purchases[:5]
        ],
        "recent_transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "type": t.type,
                "status": t.status,
                "date": t.created_at.strftime("%d %b") if t.created_at else "Недавно"
            } for t in transactions[:5]
        ]
    }

@router.get("/me/purchases")
async def get_my_purchases(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Purchase).where(Purchase.user_id == current_user.id)
    )
    return result.scalars().all()

@router.get("/me/assets")
async def get_my_assets(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Asset).where(Asset.author_id == current_user.id)
    )
    return result.scalars().all()

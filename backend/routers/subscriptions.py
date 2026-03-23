from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone
from database import get_db
from models import User, Transaction
from auth import get_current_user

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

TIERS = {
    "starter": {"price": 2000, "limit": 100},
    "medium": {"price": 5000, "limit": 500},
    "max": {"price": 9000, "limit": 1000}
}

@router.post("/purchase")
async def purchase_subscription(tier: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if tier not in TIERS:
        raise HTTPException(status_code=400, detail="Неверный тип подписки")
    
    plan = TIERS[tier]
    if current_user.balance < plan["price"]:
        raise HTTPException(status_code=400, detail="Недостаточно средств на балансе")
    
    # Process purchase
    current_user.balance -= plan["price"]
    current_user.subscription_tier = tier
    current_user.monthly_uploads_count = 0
    current_user.last_upload_reset = datetime.now(timezone.utc)
    
    # Log transaction
    transaction = Transaction(
        user_id=current_user.id,
        amount=-plan["price"],
        type=f"subscription_{tier}",
        status="completed"
    )
    
    db.add(transaction)
    await db.commit()
    await db.refresh(current_user)
    
    return {
        "status": "success",
        "message": f"Подписка {tier.capitalize()} успешно активирована!",
        "new_tier": tier,
        "balance": current_user.balance
    }

@router.get("/me")
async def get_my_subscription(current_user: User = Depends(get_current_user)):
    tier = current_user.subscription_tier or "free"
    limit = 5 if tier == "free" else TIERS.get(tier, {}).get("limit", 0)
    
    return {
        "tier": tier,
        "uploads_count": current_user.uploads_count,
        "monthly_uploads_count": current_user.monthly_uploads_count,
        "limit": limit
    }

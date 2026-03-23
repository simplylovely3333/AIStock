import os
from groq import Groq
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Dict, Any

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

from database import get_db
from models import Asset, Purchase, User, Notification, Subscription
from auth import get_current_user

router = APIRouter(prefix="/api/assets", tags=["assets"])

class AuthorSchema(BaseModel):
    id: int
    name: str
    avatar: str
    verified: bool
    sales: int

class AssetResponse(BaseModel):
    id: int
    title: str
    description: str
    price: float
    image_url: str
    category: str
    author_name: str
    
    isNew: bool = False
    isHot: bool = True
    isFree: bool = False
    resolution: str = "4K"
    sales: int = 1500
    rating: float = 4.8
    reviews: int = 120
    tags: List[str] = ["AI", "Template"]
    license: str = "Standard"
    palette: List[str] = ["#ff00cc", "#3333ff"]
    author: AuthorSchema = None

    class Config:
        from_attributes = True

def enrich_asset(a: Asset) -> dict:
    d = {c.name: getattr(a, c.name) for c in a.__table__.columns}
    d["isFree"] = (a.price == 0)
    d["author"] = {
        "id": a.author_id or 1,
        "name": a.author_name,
        "avatar": "🤖",
        "verified": True,
        "sales": 5000
    }
    return d

@router.get("/", response_model=List[AssetResponse])
async def get_all_assets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Asset).where(Asset.is_approved == True))
    assets = result.scalars().all()
    return [enrich_asset(a) for a in assets]

class AssetCreate(BaseModel):
    title: str
    description: str
    price: float
    category: str
    image_url: str = "https://images.unsplash.com/photo-1620121692029-d088224ddc74?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"

@router.post("/", response_model=AssetResponse)
async def create_asset(asset: AssetCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import datetime, timezone, timedelta
    
    # 1. Check for monthly reset
    now = datetime.now(timezone.utc)
    if current_user.last_upload_reset:
        # Check if 30 days passed since last reset
        if now - current_user.last_upload_reset.replace(tzinfo=timezone.utc) > timedelta(days=30):
            current_user.monthly_uploads_count = 0
            current_user.last_upload_reset = now

    # 2. Check limits
    tier = current_user.subscription_tier or "free"
    limit_reached = False
    limit_msg = ""

    if tier == "free":
        if current_user.uploads_count >= 5:
            limit_reached = True
            limit_msg = "Вы достигли лимита в 5 бесплатных выкладываний. Пожалуйста, приобретите подписку."
    elif tier == "starter":
        if current_user.monthly_uploads_count >= 100:
            limit_reached = True
            limit_msg = "Вы достигли месячного лимита (100) для тарифа Starter."
    elif tier == "medium":
        if current_user.monthly_uploads_count >= 500:
            limit_reached = True
            limit_msg = "Вы достигли месячного лимита (500) для тарифа Medium."
    elif tier == "max":
        if current_user.monthly_uploads_count >= 1000:
            limit_reached = True
            limit_msg = "Вы достигли месячного лимита (1000) для тарифа Max."

    if limit_reached:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=limit_msg)

    # 3. Content Automoderation
    mod_prompt = f"""You are a strict content moderator for a digital asset marketplace. Analyze this submission for malware, illegal content, or 18+ adult material.
    Title: {asset.title}
    Description: {asset.description}
    Category: {asset.category}
    Respond ONLY with the word "SAFE" if it is acceptable, or "UNSAFE" if it violates policies.
    """
    try:
        mod_res = client.chat.completions.create(
            messages=[{"role": "user", "content": mod_prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=10
        )
        verdict = mod_res.choices[0].message.content.strip().upper()
        if "UNSAFE" in verdict:
            raise HTTPException(status_code=400, detail="Проект отклонен системой автомодерации. Запрещен 18+ или вредоносный контент.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Mod error: {e}")
        # On groq failure, we allow it but mark it for manual review. For now we just let it pass.

    # 4. Create asset
    new_asset = Asset(
        title=asset.title,
        description=asset.description,
        price=asset.price,
        image_url=asset.image_url,
        category=asset.category,
        author_id=current_user.id,
        author_name=current_user.name,
        is_approved=True # Auto-approve for safe content
    )
    
    # 5. Update user stats
    current_user.uploads_count += 1
    current_user.monthly_uploads_count += 1
    current_user.is_creator = True
    
    db.add(new_asset)
    await db.commit()
    await db.refresh(new_asset)
    
    # 6. Notifications
    upload_notif = Notification(
        user_id=current_user.id,
        type="upload",
        title="Проект опубликован",
        message=f"Ваш проект '{new_asset.title}' успешно загружен и опубликован."
    )
    db.add(upload_notif)
    
    subs_res = await db.execute(select(Subscription).where(Subscription.author_id == current_user.id))
    followers = subs_res.scalars().all()
    for sub in followers:
        follower_notif = Notification(
            user_id=sub.follower_id,
            type="author",
            title="Новинка!",
            message=f"Автор {current_user.name} выпустил новый проект: '{new_asset.title}'!"
        )
        db.add(follower_notif)
        
    await db.commit()

    return enrich_asset(new_asset)

@router.get("/{asset_id}", response_model=AssetResponse)
async def get_single_asset(asset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return enrich_asset(asset)

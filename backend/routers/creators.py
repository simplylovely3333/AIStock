from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel
from typing import List

from database import get_db
from models import User, Subscription, Asset
from auth import get_current_user

router = APIRouter(prefix="/api/creators", tags=["creators"])

import os
import json
from groq import Groq

# Configure Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

class CreatorResponse(BaseModel):
    id: int
    name: str
    avatar: str
    is_creator: bool
    assets_count: int = 0
    followers_count: int = 0
    avg_rating: float = 0.0
    avg_price: float = 0.0
    ai_category: str = "Новичок"
    ai_justification: str = ""

    class Config:
        from_attributes = True

@router.get("/", response_model=List[CreatorResponse])
async def get_creators(db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.is_creator == True)
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    creators_stats = []
    for u in users:
        # Stats from Assets
        stats_stmt = select(
            func.count(Asset.id),
            func.avg(Asset.rating),
            func.avg(Asset.price)
        ).where(Asset.author_id == u.id, Asset.is_approved == True)
        
        stats_res = await db.execute(stats_stmt)
        assets_count, avg_rating, avg_price = stats_res.fetchone()
        
        assets_count = assets_count or 0
        avg_rating = round(float(avg_rating or 0.0), 1)
        avg_price = round(float(avg_price or 0.0), 0)

        # Follower count
        follower_ct = await db.execute(select(func.count(Subscription.id)).where(Subscription.author_id == u.id))
        followers_count = follower_ct.scalar() or 0
        
        creators_stats.append({
            "id": u.id,
            "name": u.name,
            "avatar": u.avatar or "🤖",
            "is_creator": u.is_creator,
            "assets_count": assets_count,
            "followers_count": followers_count,
            "avg_rating": avg_rating,
            "avg_price": avg_price
        })

    # AI Categorization
    try:
        if not creators_stats: return []
        
        context_str = "AUTHORS PERFORMANCE DATA:\n"
        for c in creators_stats:
            context_str += f"- [ID:{c['id']}] {c['name']}: {c['assets_count']} assets, Avg Rating: {c['avg_rating']}, Avg Price: {c['avg_price']} T\n"

        prompt = f"""
        Analyze these authors and assign each a "Strategic Category" (ai_category) and a short justification (ai_justification).
        Categories should be creative: "Premium Master", "Value Hero", "Rising Star", "Elite Veteran", "Eco Friendly".
        Base it on:
        - High Price + High Rating = Premium
        - Low Price + High Rating = Best Value
        - High Asset Count = Veteran
        
        Return JSON object: {{"rankings": [{{ "id": ID, "ai_category": "...", "ai_justification": "..." }}, ...]}}
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a professional Marketplace Analyst. Return ONLY JSON."},
                {"role": "user", "content": context_str + prompt}
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        
        ai_data = json.loads(chat_completion.choices[0].message.content)
        rank_map = {r["id"]: r for r in ai_data.get("rankings", [])}

        for c in creators_stats:
            rank = rank_map.get(c["id"], {})
            c["ai_category"] = rank.get("ai_category", "Автор")
            c["ai_justification"] = rank.get("ai_justification", "Анализ данных...")

    except Exception as e:
        print(f"CREATOR AI RANKING ERROR: {e}")
        for c in creators_stats:
            c["ai_category"] = "Автор"
            c["ai_justification"] = "Статистика уточняется"

    return creators_stats

@router.post("/{author_id}/subscribe")
async def subscribe_to_creator(author_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if author_id == current_user.id:
        raise HTTPException(status_code=400, detail="Вы не можете подписаться на самого себя")
    
    stmt = select(Subscription).where(Subscription.follower_id == current_user.id, Subscription.author_id == author_id)
    res = await db.execute(stmt)
    existing = res.scalars().first()
    
    if existing:
        await db.delete(existing)
        action = "unsubscribed"
    else:
        new_sub = Subscription(follower_id=current_user.id, author_id=author_id)
        db.add(new_sub)
        action = "subscribed"
        
    await db.commit()
    return {"message": action}

import os
import json
from groq import Groq
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from models import Asset, User

router = APIRouter(prefix="/api/ai-search", tags=["AI Search"])

# Configure Groq with environment variable
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

class AISearchRequest(BaseModel):
    prompt: str
    visible_assets: Optional[List[int]] = [] # IDs of assets currently on screen

class SearchResultItem(BaseModel):
    id: Optional[int] = None
    type: str = "asset" # 'asset', 'creator', 'page'
    label: str = "Unknown"
    url: str = "/browse"
    description: Optional[str] = None
    thumb: Optional[str] = None
    is_recommendation: bool = False
    reason: Optional[str] = None

class AISearchResult(BaseModel):
    text_response: str
    results: List[SearchResultItem]

SYSTEM_PROMPT = """
You are "AIStock Smart Assistant", a professional sales specialist and consultant for the AIStock digital marketplace.
Your goal is to help users find the perfect assets, compare options, provide persuasive reasons to purchase, and recommend the best authors.

CONTEXT:
1. SITE PAGES: Catalog (/browse), Authors (/creators), Pricing (/pricing), Profile (/profile).
2. ALL ASSETS: {context}
3. VISIBLE TO USER (ON-SCREEN): {visible_context}
4. PLATFORM AUTHORS: {creators_context}

YOUR TASKS:
- ADVISE: If the user is unsure, suggest the best-matched asset and explain WHY it fits their need.
- COMPARE: If multiple assets fit, highlight differences in price, style, or features.
- PERSUADE: Use professional sales logic. Highlight "Best Value", "Premium Choice", or "Highly Rated".
- CONTEXTUAL: If 'VISIBLE TO USER' context is provided, prioritize suggesting those items first.
- AUTHORS: If the user asks about authors, creators, or who to follow/buy from, analyze the PLATFORM AUTHORS and recommend the most suitable ones based on their stats.

RETURN FORMAT:
You must return a JSON object with:
1. "text_response": A persuasive, friendly response in Russian. Use terms like "Я рекомендую...", "Если сравнить...".
2. "results": A list of search result items.
   - "id": number (REQUIRED for assets/creators)
   - "type": "asset" | "creator" | "page" (REQUIRED)
   - "label": title or name
   - "is_recommendation": true if this is your specific advice for the prompt.
   - "reason": A short one-sentence sales pitch for this specific item.

Return ONLY JSON.
"""

@router.post("/", response_model=AISearchResult)
async def ai_search(req: AISearchRequest, db: AsyncSession = Depends(get_db)):
    if not req.prompt:
        raise HTTPException(status_code=400, detail="Empty prompt")

    try:
        # 1. Gather Context
        a_result = await db.execute(select(Asset).where(Asset.is_approved == True))
        assets = a_result.scalars().all()
        
        c_result = await db.execute(select(User).where(User.is_creator == True))
        creators = c_result.scalars().all()
        
        context_str = ""
        for a in assets:
            context_str += f"- [ID:{a.id}] {a.title} ({a.price} T) {a.description[:50]}\n"
            
        visible_context = "None"
        if req.visible_assets:
            visible_context = ""
            for a_id in req.visible_assets:
                a = next((x for x in assets if x.id == a_id), None)
                if a:
                    visible_context += f"- [ID:{a.id}] {a.title} ({a.price} T)\n"

        creators_context = ""
        for c in creators:
            bio_snippet = c.bio[:50] if c.bio else 'Нет описания'
            creators_context += f"- [ID:{c.id}] {c.name} (Tier: {c.subscription_tier}, Uploads: {c.uploads_count}) - {bio_snippet}\n"

        # 2. Call Groq
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT.format(context=context_str, visible_context=visible_context, creators_context=creators_context),
                },
                {
                    "role": "user",
                    "content": req.prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
        
        raw_response = chat_completion.choices[0].message.content.strip()
        data = json.loads(raw_response)
        
        for item in data.get("results", []):
            i_type = item.get("type")
            i_id = item.get("id")
            
            if i_type == "asset" and i_id:
                try: i_id = int(i_id)
                except: pass
                matched_asset = next((a for a in assets if a.id == i_id), None)
                if matched_asset:
                    item["thumb"] = matched_asset.image_url
                    item["url"] = f"/asset/{matched_asset.id}"
            elif i_type == "creator" and i_id:
                try: i_id = int(i_id)
                except: pass
                matched_creator = next((c for c in creators if c.id == i_id), None)
                if matched_creator:
                    item["thumb"] = matched_creator.avatar or "🤖"
                    item["url"] = f"/creators"

        return data
        
    except Exception as e:
        print(f"AI SEARCH (GROQ) ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")

import os
from groq import Groq
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/metadata", tags=["Metadata"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

class MetadataRequest(BaseModel):
    raw_idea: str
    category: str

class MetadataResponse(BaseModel):
    title: str
    description: str
    tags: List[str]

SYSTEM_PROMPT = """
You are an expert copywriter and SEO specialist for "AIStock", a digital asset marketplace.
The user will provide you with the FILENAME of an uploaded asset (and sometimes brief messy text).
Your task is to analyze this filename along with the given category, guess the content of the asset, and generate a highly professional and optimized listing.

1. A catchy, professional title.
2. A detailed, appealing description (3-4 sentences) that highlights the value of the asset and how it can be used.
3. A list of 5-10 highly relevant, trendy tags (comma-separated visually, but returned as an array).

Return ONLY a valid JSON object with keys: "title", "description", "tags".
Example:
Input: "cyberpunk_neon_city_v2.png", "images"
Output: {"title": "Cyberpunk Neon Cityscape Background", "description": "A stunning high-resolution neon city background with cyberpunk aesthetics. Featuring glowing skyscrapers and futuristic streets, this asset is perfect for sci-fi game development, streaming overlays, and digital art projects.", "tags": ["cyberpunk", "city", "neon", "background", "sci-fi", "futuristic", "metropolis"]}
"""

@router.post("/generate", response_model=MetadataResponse)
async def generate_metadata(req: MetadataRequest):
    if not req.raw_idea:
        raise HTTPException(status_code=400, detail="Text input is required")

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Raw Input: {req.raw_idea}\nCategory: {req.category}"}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=512,
            response_format={"type": "json_object"}
        )
        
        import json
        content = chat_completion.choices[0].message.content
        return json.loads(content)
        
    except Exception as e:
        print(f"METADATA GEN ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

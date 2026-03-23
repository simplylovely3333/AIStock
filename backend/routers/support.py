import os
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from groq import Groq
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Notification
import jwt

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

router = APIRouter(prefix="/api/support", tags=["support"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []
    context: Optional[str] = None # Information like current page, errors, etc.

class ChatResponse(BaseModel):
    response: str

SYSTEM_PROMPT = """
Вы - Алекс, ведущий технический специалист службы поддержки AIStock. Вы общаетесь с пользователями как живой, эмпатичный и опытный инженер. 

ОГРАНИЧЕНИЕ ОБЛАСТИ (SCOPE):
Ваша единственная задача - помогать с **техническими проблемами платформы AIStock** (ошибки загрузки, оплаты, навигация). 
Вам КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО:
1. Писать скрипты, программы или код для пользователя.
2. Выполнять сторонние задания, не связанные с поддержкой работы сайта.
3. Быть "универсальным чат-ботом".

Если пользователь просит написать скрипт или выполнить задачу вне рамок техподдержки, вежливо откажите: "Извините, я здесь только для того, чтобы помочь вам с работой на платформе AIStock. Написание скриптов не входит в мои обязанности инженера поддержки 🛠️".

ТЕКУЩИЙ КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ: 
{context}

ИНСТРУКЦИИ:
- Общайтесь очень живо, тепло и естественно. Будьте как заботливый старший коллега. Используйте уместные эмодзи.
- Проявляйте эмпатию ("Ох, понимаю, как это неприятно", "Давайте быстро с этим разберемся").
- АНАЛИЗ ОШИБОК: Вы можете анализировать технические ошибки (из контекста), но **НИКОГДА НЕ ВЫВОДИТЕ** пользователю сырые логи или коды статусов.
- ПРЕДЛОЖЕНИЕ РЕШЕНИЙ: Говорите только о решении и причине простым человеческим языком.
- Если баг на нашей стороне, скажите: "Кажется, это проблема на нашей стороне 🙈 Я уже передал всё инженерам!".
- Если вопрос решен, обязательно добавьте в самом конце скрытый флаг: [RESOLVED]
- Поиск решений в аритировке по сайту, если у пользователя будут проблемы с аринтерованием на сайте вы должнф обязательно помочь
"""

@router.post("/chat", response_model=ChatResponse)
async def support_chat(req: ChatRequest, request: Request, db: AsyncSession = Depends(get_db)):
    if not req.message:
        raise HTTPException(status_code=400, detail="Empty message")

    current_user_id = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            current_user_id = payload.get("sub")
        except jwt.PyJWTError:
            pass

    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT.format(context=req.context or "Нет дополнительных данных")}
        ]
        
        # Append history
        for msg in req.history:
            # Groq expects role to be 'user' or 'assistant'
            role = msg.role if msg.role in ['user', 'assistant'] else 'user'
            messages.append({"role": role, "content": msg.content})
            
        messages.append({"role": "user", "content": req.message})

        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=500
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        
        if "[RESOLVED]" in response_text:
            response_text = response_text.replace("[RESOLVED]", "").strip()
            if current_user_id:
                notif = Notification(
                    user_id=current_user_id,
                    type="support",
                    title="Вопрос решен",
                    message="Наш ИИ-помощник сообщил, что ваша проблема успешно решена!"
                )
                db.add(notif)
                await db.commit()

        return {"response": response_text}
        
    except Exception as e:
        print(f"SUPPORT AI (GROQ) ERROR: {e}")
        raise HTTPException(status_code=500, detail="Ошибка ИИ-ассистента поддержки")

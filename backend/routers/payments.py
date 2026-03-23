from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
import uuid

from database import get_db
from models import User, Transaction
from auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["payments"])

class DepositRequest(BaseModel):
    amount: float # KZT

class PaymentSessionResponse(BaseModel):
    session_id: str
    payment_url: str

class WebhookRequest(BaseModel):
    session_id: str
    status: str # "success", "failed"

class CardInfoRequest(BaseModel):
    bin: str

class CardInfoResponse(BaseModel):
    brand: str = "Unknown"
    country: str = "Unknown"
    country_flag: str = "🏳️"
    bank: str = "Unknown"
    cardholder_name: str = None

BIN_DATABASE = {
    "444444": {"brand": "Visa", "country": "Kazakhstan", "flag": "🇰🇿", "bank": "Halyk Bank"},
    "510621": {"brand": "Mastercard", "country": "Kazakhstan", "flag": "🇰🇿", "bank": "Kaspi Bank"},
    "555555": {"brand": "Mastercard", "country": "USA", "flag": "🇺🇸", "bank": "Chase"},
    "411111": {"brand": "Visa", "country": "UAE", "flag": "🇦🇪", "bank": "Emirates NBD"},
    "400000": {"brand": "Visa", "country": "Russia", "flag": "🇷🇺", "bank": "Sberbank"},
}

@router.post("/card-info", response_model=CardInfoResponse)
async def get_card_info(req: CardInfoRequest):
    bin_6 = req.bin[:6]
    info = BIN_DATABASE.get(bin_6, {})
    
    res = CardInfoResponse(
        brand=info.get("brand", "Unknown"),
        country=info.get("country", "Unknown"),
        country_flag=info.get("flag", "🏳️"),
        bank=info.get("bank", "Unknown")
    )
    
    # Special Test Case for the user
    # If the BIN/Card ends with 7777 (mocked via BIN here for simplicity or full number check)
    if req.bin.endswith("7777"):
        res.cardholder_name = "Beksultan Абдураимов"
    
    return res

@router.post("/topup")
async def process_topup(amount: float, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")
    
    current_user.balance += amount
    txn = Transaction(user_id=current_user.id, amount=amount, type="deposit", status="completed")
    db.add(txn)
    await db.commit()
    await db.refresh(current_user)
    
    return {"status": "success", "new_balance": current_user.balance}

# In real life, this would be a table, but we use a dict for pending mock sessions
PENDING_SESSIONS = {}

@router.post("/deposit", response_model=PaymentSessionResponse)
async def create_deposit_session(req: DepositRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    session_id = str(uuid.uuid4())
    PENDING_SESSIONS[session_id] = {
        "user_id": current_user.id,
        "amount": req.amount
    }
    
    # Mock URL - the frontend will intercept this or redirect to a mock component
    return PaymentSessionResponse(
        session_id=session_id,
        payment_url=f"/freedom-pay/checkout/{session_id}"
    )

@router.post("/webhook")
async def freedom_webhook(req: WebhookRequest, db: AsyncSession = Depends(get_db)):
    session = PENDING_SESSIONS.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия оплаты не найдена")
        
    if req.status == "success":
        # Process payment
        stmt = select(User).where(User.id == session["user_id"])
        result = await db.execute(stmt)
        user = result.scalars().first()
        if user:
            user.balance += session["amount"]
            
            # Record transaction
            txn = Transaction(user_id=user.id, amount=session["amount"], type="deposit", status="completed")
            db.add(txn)
            await db.commit()
            
    # Remove from pending
    del PENDING_SESSIONS[req.session_id]
    return {"status": "ok"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from routers import auth, payments, assets, orders, creators, ai_search, metadata, users, subscriptions, support, interactions

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="AI Asset Marketplace API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(payments.router)
app.include_router(assets.router)
app.include_router(orders.router)
app.include_router(creators.router)
app.include_router(ai_search.router)
app.include_router(metadata.router)
app.include_router(users.router)
app.include_router(subscriptions.router)
app.include_router(support.router)
app.include_router(interactions.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "API with SQLite is running"}

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine, Base, AsyncSessionLocal
from models import Asset, User

USERS_DATA = [
    {"name": "Midjourney Labs", "email": "mj@example.com", "is_creator": True, "avatar": "👨‍🎨"},
    {"name": "Aura Design", "email": "aura@example.com", "is_creator": True, "avatar": "✨"},
    {"name": "PromptMaster", "email": "pm@example.com", "is_creator": True, "avatar": "✍️"},
    {"name": "AgentOps", "email": "ao@example.com", "is_creator": True, "avatar": "🤖"}
]

ASSETS_DATA = [
    {
        "title": "Neon Cyberpunk City UI Kit",
        "description": "Потрясающий темный киберпанк UI-кит с неоновыми светящимися элементами. Идеально подходит для футуристических веб-сайтов или игровых интерфейсов.",
        "price": 2500,
        "category": "3d",
        "author_idx": 0,
        "is_approved": True,
        "image_url": "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&q=80&w=1200"
    },
    {
        "title": "Minimalist Code Dashboard UI",
        "description": "Чистый, светлый компонент дашборда разработчика, созданный с помощью инструментов ИИ. Включает красивую типографику и графики.",
        "price": 0,
        "category": "images",
        "author_idx": 1,
        "is_approved": True,
        "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200"
    },
    {
        "title": "Ultimate Midjourney Portrait Prompts",
        "description": "Коллекция из 50 высокодетализированных промптов для создания гиперреалистичных портретов людей в Midjourney v6.",
        "price": 1200,
        "category": "prompts",
        "author_idx": 2,
        "is_approved": True,
        "image_url": "https://images.unsplash.com/photo-1682687982501-1e5898cb89cc?auto=format&fit=crop&q=80&w=1200"
    },
    {
        "title": "LangChain Customer Support Bot",
        "description": "Полностью готовый исходный код для создания RAG-агента поддержки клиентов на LangChain. Поддерживает историю диалогов, векторный поиск по документам.",
        "price": 8500,
        "category": "agents",
        "author_idx": 3,
        "is_approved": True,
        "image_url": "https://images.unsplash.com/photo-1678122394553-7313a1a63c63?auto=format&fit=crop&q=80&w=1200"
    },
    {
        "title": "AutoGPT Marketing Strategist",
        "description": "Промпт-структура и Python-скрипт для автономного маркетингового ИИ-агента, который может планировать кампании, парсить конкурентов и генерировать посты.",
        "price": 12000,
        "category": "agents",
        "author_idx": 3,
        "is_approved": True,
        "image_url": "https://images.unsplash.com/photo-1633534570183-b9dc3eb09bf9?auto=format&fit=crop&q=80&w=1200"
    },
    {
        "title": "Stock Market Predictor Workflow",
        "description": "Готовый Workflow в N8N с ИИ-агентом, который анализирует настроения в ежедневных новостях и историю акций с использованием GPT-4 API.",
        "price": 6000,
        "category": "agents",
        "author_idx": 3,
        "is_approved": True,
        "image_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1200"
    }
]

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        # 1. Create Users
        db_users = []
        for u in USERS_DATA:
            user = User(name=u["name"], email=u["email"], is_creator=u["is_creator"], avatar=u["avatar"], hashed_password="")
            session.add(user)
            db_users.append(user)
        
        await session.commit()
        for u in db_users:
            await session.refresh(u)
            
        # 2. Add Initial Assets
        for item in ASSETS_DATA:
            author = db_users[item.pop("author_idx")]
            asset = Asset(**item, author_id=author.id, author_name=author.name)
            session.add(asset)

        # 3. Generate 10+ new assets per category
        CATEGORIES = {
            "images": [
                "Abstract AI Architecture", "Cyberpunk Forest", "Neon Portrait Study", "Minimalist Tech Pattern",
                "Retro-Future UI", "Holographic Landscape", "Biometric Mesh", "Neural Network Viz",
                "Digital Dreamscape", "Futuristic Office"
            ],
            "video": [
                "Cinematic Drone Flyover AI City", "Time-lapse Neural Growth", "Abstract Glitch Loop",
                "Synthwave Sunset Drive", "Digital Rain Matrix Effect", "AI Particle Simulation",
                "Futuristic Data Flow", "Cyber City Traffic", "Robot Factory Loop", "Stellar AI Journey"
            ],
            "audio": [
                "Ambient Sci-Fi Soundscape", "Cyberpunk Beat Pack", "Minimalist Tech Loop",
                "AI Voice Assistant Samples", "Glitchy Notification Sounds", "Neural Subsystem Hum",
                "Stellar Space Texture", "Retro-Future Pad", "Digital Data Stream Sound", "Cyber Bass Shot"
            ],
            "3d": [
                "Sci-Fi Control Panel", "Robot Hand Model", "Futuristic Helmet", "Cyberpunk Street Lamp",
                "AI server Rack", "Holographic Projector", "Bio-Mech Heart", "Digital Brain Model",
                "Quantum Terminal", "Hover Car Concept"
            ],
            "prompts": [
                "Anime Style Character Prompts", "Stable Diffusion Architecture Bundle", "Logo Design Masterclass Prompts",
                "Oil Painting AI Prompts", "3D Icon Set Prompt Kit", "Vaporwave Aesthetic Prompts",
                "Macro Nature Photo Prompts", "Architectural Blueprint Prompts", "Flat Illustration Pack Prompts", "UI Layout Generator Prompts"
            ],
            "agents": [
                "SEO Optimization Agent", "Smart Code Reviewer", "Financial News Analyst", "Recipe Generator Bot",
                "Travel Planner AI", "Social Media Scheduler Agent", "Email Draft Assistant", "Language Learning Tutor",
                "Fitness Coach AI", "Legal Document Summarizer"
            ]
        }

        import random
        for cat, titles in CATEGORIES.items():
            for i, title in enumerate(titles):
                price = random.choice([0, 500, 1500, 3000, 5500, 9000, 15000])
                author = random.choice(db_users)
                img_id = random.randint(10, 1000)
                
                rating = round(random.uniform(3.5, 5.0), 1)
                reviews = random.randint(0, 50)
                
                asset = Asset(
                    title=title,
                    description=f"Высококачественный ассет в категории {cat}. {title} поможет вам ускорить рабочий процесс и вдохновит на новые идеи.",
                    price=price,
                    category=cat,
                    author_id=author.id,
                    author_name=author.name,
                    is_approved=True,
                    rating=rating,
                    reviews_count=reviews,
                    image_url=f"https://picsum.photos/seed/{cat}_{i}/800/600"
                )
                session.add(asset)
            
        await session.commit()
    print("База успешно заполнена! Добавлено более 60 ассетов во все категории.")

if __name__ == "__main__":
    asyncio.run(seed())

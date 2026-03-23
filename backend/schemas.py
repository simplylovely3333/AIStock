from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    balance: float
    avatar: str | None = None
    bio: str | None = None
    social_links: str | None = None
    is_creator: bool = False
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    avatar: str | None = None
    bio: str | None = None
    social_links: str | None = None

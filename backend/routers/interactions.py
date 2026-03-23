from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import List

from database import get_db
from models import User, Asset, Favorite, Notification, Subscription
from auth import get_current_user

router = APIRouter(prefix="/api/interactions", tags=["Interactions"])

# --- FAVORITES ---

@router.post("/favorite/{asset_id}")
async def toggle_favorite(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if asset exists
    asset_res = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = asset_res.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Check if already favorited
    fav_res = await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id, Favorite.asset_id == asset_id)
    )
    fav = fav_res.scalar_one_or_none()
    
    if fav:
        # Remove it
        await db.delete(fav)
        await db.commit()
        return {"status": "removed"}
    else:
        # Add it
        new_fav = Favorite(user_id=current_user.id, asset_id=asset_id)
        db.add(new_fav)
        await db.commit()
        return {"status": "added"}

@router.get("/favorites")
async def get_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(
        select(Asset).join(Favorite, Favorite.asset_id == Asset.id).where(Favorite.user_id == current_user.id)
    )
    return res.scalars().all()

# --- NOTIFICATIONS ---

@router.get("/notifications")
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc())
    )
    return res.scalars().all()

@router.post("/notifications/{notif_id}/read")
async def mark_notification_read(
    notif_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(
        select(Notification).where(Notification.id == notif_id, Notification.user_id == current_user.id)
    )
    notif = res.scalar_one_or_none()
    if notif:
        notif.is_read = True
        await db.commit()
        return {"status": "read"}
    raise HTTPException(status_code=404, detail="Notification not found")

@router.post("/notifications/read-all")
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False)
    )
    unread = res.scalars().all()
    for n in unread:
        n.is_read = True
    await db.commit()
    return {"status": "all_read"}

# --- FOLLOWERS ---

@router.post("/follow/{author_id}")
async def toggle_follow(
    author_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if author_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
        
    author_res = await db.execute(select(User).where(User.id == author_id))
    if not author_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Author not found")

    sub_res = await db.execute(
        select(Subscription).where(Subscription.follower_id == current_user.id, Subscription.author_id == author_id)
    )
    sub = sub_res.scalar_one_or_none()
    
    if sub:
        await db.delete(sub)
        await db.commit()
        return {"status": "unfollowed"}
    else:
        new_sub = Subscription(follower_id=current_user.id, author_id=author_id)
        db.add(new_sub)
        
        # Create a notification for the author
        notif = Notification(
            user_id=author_id,
            type="author",
            title="Новый подписчик!",
            message=f"Пользователь {current_user.name} подписался на вас."
        )
        db.add(notif)
        
        await db.commit()
        return {"status": "followed"}

@router.get("/following")
async def get_following(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(
        select(Subscription.author_id).where(Subscription.follower_id == current_user.id)
    )
    return res.scalars().all()

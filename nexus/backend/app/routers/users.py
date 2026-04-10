from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import UserProfileUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    payload: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.area is not None:
        current_user.area = payload.area
    if payload.cargo is not None:
        current_user.cargo = payload.cargo
    if payload.regiao is not None:
        current_user.regiao = payload.regiao
    if payload.interesses is not None:
        current_user.interesses = payload.interesses

    await db.commit()
    await db.refresh(current_user)
    return current_user

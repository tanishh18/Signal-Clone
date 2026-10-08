from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import User
from app.auth import get_current_user
from app.schemas import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the authenticated user's profile.
    """
    return UserResponse.model_validate(current_user)


@router.get("/search", response_model=List[UserResponse])
def search_users(
    q: str = Query(..., min_length=1, max_length=100, description="Search query for username or display name"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Searches users by username or display name.
    Excludes the current user from search results.
    Never exposes passwords, hashes, or private credentials.
    """
    query_str = f"%{q.strip().lower()}%"
    users = db.query(User).filter(
        User.id != current_user.id,
        or_(
            User.username.ilike(query_str),
            User.display_name.ilike(query_str),
            User.phone.ilike(query_str)
        )
    ).limit(20).all()

    return [UserResponse.model_validate(u) for u in users]

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import User, utc_now
from app.auth import (
    verify_mock_otp,
    create_access_token,
    get_current_user
)
from app.schemas import (
    OTPRequest,
    OTPResponse,
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/request-otp", response_model=OTPResponse)
def request_otp(payload: OTPRequest):
    """
    Mocked OTP request endpoint.
    Returns the fixed demonstration code '123456'.
    """
    return OTPResponse(
        identifier=payload.identifier,
        otp="123456",
        message="Use verification code 123456 to log in or register."
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user using username/phone, display name, avatar, and mocked OTP.
    """
    if not verify_mock_otp(payload.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please use 123456."
        )

    # Check for existing username
    existing_user = db.query(User).filter(User.username == payload.username.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken. Please choose another."
        )

    # Check for existing phone if provided
    if payload.phone:
        existing_phone = db.query(User).filter(User.phone == payload.phone.strip()).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Phone number is already registered."
            )

    # Create new user
    new_user = User(
        username=payload.username.lower(),
        phone=payload.phone.strip() if payload.phone else None,
        display_name=payload.display_name.strip(),
        avatar_url=payload.avatar_url,
        password_hash="mock_otp_verified",
        is_online=True,
        last_seen=utc_now()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "username": new_user.username})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Log in using username or phone number along with the mocked OTP.
    """
    if not verify_mock_otp(payload.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please use 123456."
        )

    identifier = payload.identifier.strip().lower()
    user = db.query(User).filter(
        or_(
            User.username == identifier,
            User.phone == payload.identifier.strip()
        )
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this username or phone number. Please register first."
        )

    user.is_online = True
    user.last_seen = utc_now()
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "username": user.username})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Log out the current authenticated user and update their presence/last_seen timestamp.
    """
    current_user.is_online = False
    current_user.last_seen = utc_now()
    db.commit()
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get profile information for the authenticated user.
    """
    return UserResponse.model_validate(current_user)

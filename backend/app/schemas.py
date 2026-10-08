from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# --- Authentication & User Schemas ---

class OTPRequest(BaseModel):
    identifier: str = Field(..., description="Username or phone number")


class OTPResponse(BaseModel):
    identifier: str
    otp: str = "123456"
    message: str = "Mock verification code is 123456"


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$")
    phone: Optional[str] = Field(None, max_length=30)
    display_name: str = Field(..., min_length=1, max_length=100)
    avatar_url: Optional[str] = None
    otp: str = Field(..., description="Mock OTP (use 123456)")


class UserLogin(BaseModel):
    identifier: str = Field(..., description="Username or phone number")
    otp: str = Field(..., description="Mock OTP (use 123456)")


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    phone: Optional[str] = None
    display_name: str
    avatar_url: Optional[str] = None
    is_online: bool
    last_seen: Optional[datetime] = None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

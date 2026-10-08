from datetime import datetime
from typing import Optional, List
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


# --- Contact Schemas ---

class ContactCreate(BaseModel):
    contact_id: int
    nickname: Optional[str] = None


class ContactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    contact_id: int
    nickname: Optional[str] = None
    created_at: datetime
    contact_user: UserResponse


# --- Message & Read Receipt Schemas ---

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    reply_to_id: Optional[int] = None
    message_type: str = "text"


class MessageReadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    read_at: datetime


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_id: Optional[int] = None
    content: str
    message_type: str
    status: str
    reply_to_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    sender: Optional[UserResponse] = None
    reads: List[MessageReadResponse] = []


# --- Conversation & Group Schemas ---

class ConversationMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    user_id: int
    role: str
    joined_at: datetime
    user: UserResponse


class ConversationCreateDirect(BaseModel):
    participant_id: int


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    member_ids: List[int] = Field(..., min_length=1)
    avatar_url: Optional[str] = None


class GroupAddMember(BaseModel):
    user_id: int
    role: str = "member"


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str  # "direct" or "group"
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    latest_message: Optional[MessageResponse] = None
    unread_count: int = 0
    members: List[ConversationMemberResponse] = []


class ConversationDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    members: List[ConversationMemberResponse] = []


class MarkReadResponse(BaseModel):
    conversation_id: int
    marked_count: int
    status: str = "success"

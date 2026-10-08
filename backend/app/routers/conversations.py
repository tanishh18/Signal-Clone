from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import (
    Conversation, ConversationMember, Message, MessageRead, User, utc_now
)
from app.auth import get_current_user
from app.schemas import (
    ConversationResponse,
    ConversationDetailResponse,
    ConversationCreateDirect,
    MessageResponse,
    MessageCreate,
    MarkReadResponse,
    UserResponse
)
from app.services.conversation_service import (
    find_existing_direct_conversation,
    is_conversation_member,
    calculate_unread_count,
    get_latest_message
)

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.get("", response_model=List[ConversationResponse])
def get_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns all conversations the authenticated user belongs to,
    sorted by most recent activity (updated_at desc).
    Includes latest message, unread count, and member details.
    """
    memberships = db.query(ConversationMember.conversation_id).filter(
        ConversationMember.user_id == current_user.id
    ).scalar_subquery()

    conversations = db.query(Conversation).filter(
        Conversation.id.in_(memberships)
    ).order_by(Conversation.updated_at.desc()).all()

    result = []
    for conv in conversations:
        latest = get_latest_message(db, conv.id)
        unread = calculate_unread_count(db, conv.id, current_user.id)

        # For direct conversations without an explicit name, dynamically provide other user's info
        conv_name = conv.name
        conv_avatar = conv.avatar_url
        if conv.type == "direct":
            other_member = next(
                (m.user for m in conv.members if m.user_id != current_user.id),
                None
            )
            if other_member:
                conv_name = other_member.display_name
                conv_avatar = other_member.avatar_url

        resp = ConversationResponse(
            id=conv.id,
            type=conv.type,
            name=conv_name,
            avatar_url=conv_avatar,
            created_by=conv.created_by,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            latest_message=MessageResponse.model_validate(latest) if latest else None,
            unread_count=unread,
            members=[m for m in conv.members]
        )
        result.append(resp)

    return result


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_or_get_direct_conversation(
    payload: ConversationCreateDirect,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates or retrieves a direct one-to-one conversation between two users.
    Server-side duplicate prevention guarantees that (A, B) and (B, A)
    resolve to the exact same conversation.
    """
    if payload.participant_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start a direct conversation with yourself."
        )

    target_user = db.query(User).filter(User.id == payload.participant_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # Check for existing direct conversation between exactly these two users
    existing = find_existing_direct_conversation(db, current_user.id, payload.participant_id)
    if existing:
        latest = get_latest_message(db, existing.id)
        unread = calculate_unread_count(db, existing.id, current_user.id)
        return ConversationResponse(
            id=existing.id,
            type=existing.type,
            name=target_user.display_name,
            avatar_url=target_user.avatar_url,
            created_by=existing.created_by,
            created_at=existing.created_at,
            updated_at=existing.updated_at,
            latest_message=MessageResponse.model_validate(latest) if latest else None,
            unread_count=unread,
            members=[m for m in existing.members]
        )

    # Create new direct conversation
    now = utc_now()
    new_conv = Conversation(
        type="direct",
        name=None,
        avatar_url=None,
        created_by=current_user.id,
        created_at=now,
        updated_at=now
    )
    db.add(new_conv)
    db.flush()

    m1 = ConversationMember(conversation_id=new_conv.id, user_id=current_user.id, role="member", joined_at=now)
    m2 = ConversationMember(conversation_id=new_conv.id, user_id=target_user.id, role="member", joined_at=now)
    db.add_all([m1, m2])
    db.commit()
    db.refresh(new_conv)

    return ConversationResponse(
        id=new_conv.id,
        type=new_conv.type,
        name=target_user.display_name,
        avatar_url=target_user.avatar_url,
        created_by=new_conv.created_by,
        created_at=new_conv.created_at,
        updated_at=new_conv.updated_at,
        latest_message=None,
        unread_count=0,
        members=[m for m in new_conv.members]
    )


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation_details(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves full details for a single conversation.
    Strictly verifies that the authenticated user is an authorized member.
    """
    if not is_conversation_member(db, conversation_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation."
        )

    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found."
        )

    # For direct conversations, dynamic name/avatar
    conv_name = conv.name
    conv_avatar = conv.avatar_url
    if conv.type == "direct":
        other_member = next(
            (m.user for m in conv.members if m.user_id != current_user.id),
            None
        )
        if other_member:
            conv_name = other_member.display_name
            conv_avatar = other_member.avatar_url

    return ConversationDetailResponse(
        id=conv.id,
        type=conv.type,
        name=conv_name,
        avatar_url=conv_avatar,
        created_by=conv.created_by,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        members=[m for m in conv.members]
    )


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves chronological message history for a conversation.
    Requires caller to be an active member of the conversation.
    """
    if not is_conversation_member(db, conversation_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation."
        )

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(
        Message.created_at.asc()
    ).offset(offset).limit(limit).all()

    return [MessageResponse.model_validate(m) for m in messages]


@router.post("/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sends and persists a new message to a conversation.
    Strictly verifies conversation membership and non-empty content.
    """
    if not is_conversation_member(db, conversation_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation."
        )

    content = payload.content.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    # Verify reply_to message if provided
    if payload.reply_to_id:
        reply_msg = db.query(Message).filter(
            Message.id == payload.reply_to_id,
            Message.conversation_id == conversation_id
        ).first()
        if not reply_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quoted message not found in this conversation."
            )

    now = utc_now()
    new_message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=content,
        message_type=payload.message_type,
        status="sent",
        reply_to_id=payload.reply_to_id,
        created_at=now,
        updated_at=now
    )
    db.add(new_message)

    # Update conversation's updated_at timestamp for recent activity sorting
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conv:
        conv.updated_at = now

    db.commit()
    db.refresh(new_message)

    return MessageResponse.model_validate(new_message)


@router.post("/{conversation_id}/read", response_model=MarkReadResponse)
def mark_conversation_as_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marks all unread messages from other senders in this conversation as read
    by the current user, recording recipient-specific read receipts.
    """
    if not is_conversation_member(db, conversation_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation."
        )

    # Find unread messages sent by others
    read_message_ids = db.query(MessageRead.message_id).filter(
        MessageRead.user_id == current_user.id
    ).scalar_subquery()

    unread_messages = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        ~Message.id.in_(read_message_ids)
    ).all()

    now = utc_now()
    marked_count = 0
    for msg in unread_messages:
        mr = MessageRead(
            message_id=msg.id,
            user_id=current_user.id,
            read_at=now
        )
        db.add(mr)
        # In direct chat, sender-side status updates to read
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv and conv.type == "direct":
            msg.status = "read"
        marked_count += 1

    db.commit()

    return MarkReadResponse(
        conversation_id=conversation_id,
        marked_count=marked_count,
        status="success"
    )

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Conversation, ConversationMember, User, utc_now
from app.auth import get_current_user
from app.schemas import (
    GroupCreate,
    GroupAddMember,
    ConversationResponse,
    ConversationMemberResponse
)
from app.services.conversation_service import (
    is_conversation_member,
    get_conversation_member
)

router = APIRouter(prefix="/groups", tags=["Groups"])


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    payload: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new group conversation with the creator automatically set as admin.
    """
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group name cannot be empty."
        )

    # Collect unique member IDs including creator
    all_member_ids = list(set(payload.member_ids + [current_user.id]))

    # Verify all members exist
    existing_users = db.query(User).filter(User.id.in_(all_member_ids)).all()
    if len(existing_users) != len(all_member_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more selected members do not exist."
        )

    now = utc_now()
    new_group = Conversation(
        type="group",
        name=name,
        avatar_url=payload.avatar_url,
        created_by=current_user.id,
        created_at=now,
        updated_at=now
    )
    db.add(new_group)
    db.flush()

    for uid in all_member_ids:
        role = "admin" if uid == current_user.id else "member"
        member = ConversationMember(
            conversation_id=new_group.id,
            user_id=uid,
            role=role,
            joined_at=now
        )
        db.add(member)

    db.commit()
    db.refresh(new_group)

    return ConversationResponse(
        id=new_group.id,
        type=new_group.type,
        name=new_group.name,
        avatar_url=new_group.avatar_url,
        created_by=new_group.created_by,
        created_at=new_group.created_at,
        updated_at=new_group.updated_at,
        latest_message=None,
        unread_count=0,
        members=[m for m in new_group.members]
    )


@router.get("/{group_id}/members", response_model=List[ConversationMemberResponse])
def get_group_members(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all members of a group with their roles.
    Requires caller to be an active member of the group.
    """
    conv = db.query(Conversation).filter(Conversation.id == group_id, Conversation.type == "group").first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group conversation not found."
        )

    if not is_conversation_member(db, group_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group."
        )

    return [ConversationMemberResponse.model_validate(m) for m in conv.members]


@router.post("/{group_id}/members", response_model=ConversationMemberResponse, status_code=status.HTTP_201_CREATED)
def add_group_member(
    group_id: int,
    payload: GroupAddMember,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Adds a member to an existing group.
    Strictly restricted to group admins only.
    """
    conv = db.query(Conversation).filter(Conversation.id == group_id, Conversation.type == "group").first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group conversation not found."
        )

    caller_membership = get_conversation_member(db, group_id, current_user.id)
    if not caller_membership or caller_membership.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group admins can add members."
        )

    target_user = db.query(User).filter(User.id == payload.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    existing_membership = get_conversation_member(db, group_id, payload.user_id)
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this group."
        )

    now = utc_now()
    new_member = ConversationMember(
        conversation_id=group_id,
        user_id=payload.user_id,
        role=payload.role if payload.role in ("admin", "member") else "member",
        joined_at=now
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return ConversationMemberResponse.model_validate(new_member)


@router.delete("/{group_id}/members/{user_id}")
def remove_group_member(
    group_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Removes a member from a group conversation.
    - Admins can remove any member.
    - Normal members can only remove themselves (leave group).
    - Preserves historical messages.
    - Prevents removing the last remaining admin.
    """
    conv = db.query(Conversation).filter(Conversation.id == group_id, Conversation.type == "group").first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group conversation not found."
        )

    caller_membership = get_conversation_member(db, group_id, current_user.id)
    if not caller_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group."
        )

    # Check authorization: caller is removing themselves OR caller is an admin
    if user_id != current_user.id and caller_membership.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group admins can remove members."
        )

    target_membership = get_conversation_member(db, group_id, user_id)
    if not target_membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this group."
        )

    # Last admin safeguard
    if target_membership.role == "admin":
        admin_count = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == group_id,
            ConversationMember.role == "admin"
        ).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the only group admin. Assign another admin first."
            )

    db.delete(target_membership)
    db.commit()

    return {"message": "Member removed successfully."}

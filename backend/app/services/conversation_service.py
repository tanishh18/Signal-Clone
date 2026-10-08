from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Conversation, ConversationMember, Message, MessageRead, User, utc_now


def find_existing_direct_conversation(db: Session, user_a_id: int, user_b_id: int) -> Optional[Conversation]:
    """
    Deterministically searches for an existing direct conversation between
    exactly two users, independent of ordering (A->B or B->A).
    """
    # Find all direct conversation IDs where user_a is a member
    conv_ids_a = db.query(ConversationMember.conversation_id).join(
        Conversation, Conversation.id == ConversationMember.conversation_id
    ).filter(
        Conversation.type == "direct",
        ConversationMember.user_id == user_a_id
    ).scalar_subquery()

    # Filter where user_b is also a member in those conversations
    common_convs = db.query(ConversationMember.conversation_id).filter(
        ConversationMember.conversation_id.in_(conv_ids_a),
        ConversationMember.user_id == user_b_id
    ).all()

    for (cid,) in common_convs:
        # Verify it has exactly 2 members
        member_count = db.query(func.count(ConversationMember.id)).filter(
            ConversationMember.conversation_id == cid
        ).scalar()
        if member_count == 2:
            return db.query(Conversation).filter(Conversation.id == cid).first()

    return None


def is_conversation_member(db: Session, conversation_id: int, user_id: int) -> bool:
    """Checks whether a user is an authorized member of a conversation."""
    return db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == user_id
    ).first() is not None


def get_conversation_member(db: Session, conversation_id: int, user_id: int) -> Optional[ConversationMember]:
    """Retrieves the membership record including role (admin/member)."""
    return db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == user_id
    ).first()


def calculate_unread_count(db: Session, conversation_id: int, user_id: int) -> int:
    """
    Counts messages in the conversation sent by other users that have not yet
    been acknowledged in message_reads by this user.
    """
    read_message_ids = db.query(MessageRead.message_id).filter(
        MessageRead.user_id == user_id
    ).scalar_subquery()

    return db.query(func.count(Message.id)).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != user_id,
        ~Message.id.in_(read_message_ids)
    ).scalar() or 0


def get_latest_message(db: Session, conversation_id: int) -> Optional[Message]:
    """Retrieves the most recent message for conversation preview."""
    return db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.desc()).first()

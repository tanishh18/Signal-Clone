from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    Index
)
from sqlalchemy.orm import relationship
from app.database import Base


# Convention: SQLite lacks native timezone-aware DATETIME types.
# All timestamps are generated and stored in UTC using datetime.now(timezone.utc).
# The frontend converts UTC timestamps to the user's local timezone for presentation.
def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    phone = Column(String(30), unique=True, index=True, nullable=True)
    display_name = Column(String(100), nullable=False)
    avatar_url = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    is_online = Column(Boolean, default=False, nullable=False)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    contacts = relationship(
        "Contact",
        foreign_keys="Contact.user_id",
        back_populates="owner",
        cascade="all, delete-orphan"
    )
    memberships = relationship(
        "ConversationMember",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    messages_sent = relationship(
        "Message",
        back_populates="sender"
    )
    reads = relationship(
        "MessageRead",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    nickname = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    owner = relationship("User", foreign_keys=[user_id], back_populates="contacts")
    contact_user = relationship("User", foreign_keys=[contact_id])

    __table_args__ = (
        UniqueConstraint("user_id", "contact_id", name="uq_user_contact"),
        CheckConstraint("user_id != contact_id", name="check_no_self_contact"),
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(20), nullable=False, default="direct")  # "direct" or "group"
    name = Column(String(100), nullable=True)  # Name for group conversations
    avatar_url = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False, index=True)

    # Relationships
    members = relationship(
        "ConversationMember",
        back_populates="conversation",
        cascade="all, delete-orphan"
    )
    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at.asc()"
    )
    creator = relationship("User", foreign_keys=[created_by])


class ConversationMember(Base):
    __tablename__ = "conversation_members"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False, default="member")  # "admin" or "member"
    joined_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="members")
    user = relationship("User", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_conversation_member"),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), nullable=False, default="text")  # "text", "image", "system"
    # Message status: represents the sender-side lifecycle ("sending", "sent", "delivered", "read").
    # In direct chat, status transitions to "read" when the other party reads it.
    # In group chat, messages.status remains "sent"/"delivered", while individual per-recipient
    # read receipts are tracked through the message_reads table below.
    status = Column(String(20), nullable=False, default="sent")
    reply_to_id = Column(Integer, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="messages_sent")
    reply_to = relationship("Message", remote_side=[id])
    reads = relationship(
        "MessageRead",
        back_populates="message",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_messages_conv_created", "conversation_id", "created_at"),
    )


class MessageRead(Base):
    __tablename__ = "message_reads"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    message = relationship("Message", back_populates="reads")
    user = relationship("User", back_populates="reads")

    __table_args__ = (
        UniqueConstraint("message_id", "user_id", name="uq_message_user_read"),
    )

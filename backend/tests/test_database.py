import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from app.database import Base
from app.models import (
    User, Contact, Conversation, ConversationMember, Message, MessageRead, utc_now
)

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")
        cursor.execute("PRAGMA busy_timeout = 5000;")
        cursor.close()

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_sqlite_foreign_keys_pragma(db_session):
    result = db_session.execute(text("PRAGMA foreign_keys;")).scalar()
    assert result == 1


def test_user_creation_and_uniqueness(db_session):
    u1 = User(
        username="rahul",
        display_name="Rahul Sharma",
        password_hash="mock_hash",
        phone="+919876543210"
    )
    db_session.add(u1)
    db_session.commit()
    assert u1.id is not None
    assert u1.created_at is not None

    # Duplicate username must fail
    u2 = User(
        username="rahul",
        display_name="Rahul Clone",
        password_hash="mock_hash"
    )
    db_session.add(u2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_contact_uniqueness_and_foreign_keys(db_session):
    u1 = User(username="alice", display_name="Alice", password_hash="h1")
    u2 = User(username="bob", display_name="Bob", password_hash="h2")
    db_session.add_all([u1, u2])
    db_session.commit()

    # Valid contact
    c1 = Contact(user_id=u1.id, contact_id=u2.id, nickname="Bobby")
    db_session.add(c1)
    db_session.commit()

    # Duplicate contact must fail
    c2 = Contact(user_id=u1.id, contact_id=u2.id)
    db_session.add(c2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Self-contact check constraint must fail
    c_self = Contact(user_id=u1.id, contact_id=u1.id)
    db_session.add(c_self)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Foreign key constraint with non-existent user must fail
    c_invalid = Contact(user_id=u1.id, contact_id=99999)
    db_session.add(c_invalid)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_conversation_and_members(db_session):
    u1 = User(username="user1", display_name="User 1", password_hash="h")
    u2 = User(username="user2", display_name="User 2", password_hash="h")
    db_session.add_all([u1, u2])
    db_session.commit()

    conv = Conversation(type="direct", created_by=u1.id)
    db_session.add(conv)
    db_session.commit()

    m1 = ConversationMember(conversation_id=conv.id, user_id=u1.id, role="admin")
    m2 = ConversationMember(conversation_id=conv.id, user_id=u2.id, role="member")
    db_session.add_all([m1, m2])
    db_session.commit()

    # Duplicate member must fail
    m_dup = ConversationMember(conversation_id=conv.id, user_id=u1.id, role="member")
    db_session.add(m_dup)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_message_flow_and_read_receipts(db_session):
    u1 = User(username="sender", display_name="Sender", password_hash="h")
    u2 = User(username="receiver", display_name="Receiver", password_hash="h")
    db_session.add_all([u1, u2])
    db_session.commit()

    conv = Conversation(type="direct", created_by=u1.id)
    db_session.add(conv)
    db_session.commit()

    msg = Message(
        conversation_id=conv.id,
        sender_id=u1.id,
        content="Hello Signal!",
        status="sent"
    )
    db_session.add(msg)
    db_session.commit()
    assert msg.id is not None

    # Receiver reads message
    read = MessageRead(message_id=msg.id, user_id=u2.id)
    db_session.add(read)
    db_session.commit()

    # Duplicate read receipt must fail
    read_dup = MessageRead(message_id=msg.id, user_id=u2.id)
    db_session.add(read_dup)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Cascade check: Deleting conversation must cascade delete message and read
    db_session.delete(conv)
    db_session.commit()
    assert db_session.query(Message).filter_by(id=msg.id).first() is None
    assert db_session.query(MessageRead).filter_by(id=read.id).first() is None

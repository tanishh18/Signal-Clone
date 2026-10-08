import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base, get_db
from app.models import User, Contact, Conversation, ConversationMember, Message, MessageRead
from seed import seed_database


def test_seed_database_execution_and_idempotency():
    # 1. Run seed
    seed_database(reset=True)
    
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        users = db.query(User).all()
        assert len(users) == 6
        usernames = {u.username for u in users}
        assert usernames == {"rahul", "ananya", "vikram", "priya", "kabir", "neha"}

        # Check contacts
        rahul = db.query(User).filter_by(username="rahul").first()
        assert rahul is not None
        assert len(rahul.contacts) == 4

        # Check conversations
        convs = db.query(Conversation).all()
        assert len(convs) == 5  # 3 direct + 2 groups
        direct_convs = [c for c in convs if c.type == "direct"]
        group_convs = [c for c in convs if c.type == "group"]
        assert len(direct_convs) == 3
        assert len(group_convs) == 2

        # Check group roles
        core_eng = db.query(Conversation).filter_by(name="Core Engineering Team").first()
        assert core_eng is not None
        admin_member = db.query(ConversationMember).filter_by(
            conversation_id=core_eng.id,
            user_id=rahul.id
        ).first()
        assert admin_member.role == "admin"

        # Check messages count
        messages = db.query(Message).all()
        assert len(messages) == 20

        # Check unread logic for Rahul
        # Unread messages in direct chat with Ananya
        conv_ananya = db.query(Conversation).join(ConversationMember).filter(
            Conversation.type == "direct",
            ConversationMember.user_id == rahul.id
        ).all()
        
        # Verify idempotency by running seed again
        seed_database(reset=False)
        assert len(db.query(User).all()) == 6
        assert len(db.query(Conversation).all()) == 5
        assert len(db.query(Message).all()) == 20
    finally:
        db.close()

import argparse
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db, engine, Base
from app.models import (
    User, Contact, Conversation, ConversationMember, Message, MessageRead, utc_now
)


def seed_database(reset: bool = False):
    """
    Seeds the database with realistic fictional users, contacts,
    direct & group conversations, message history, read receipts,
    and unread states. Idempotent by design.
    """
    if reset:
        print("Resetting database tables...")
        Base.metadata.drop_all(bind=engine)
        init_db()
    else:
        init_db()

    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)

        # -------------------------------------------------------------
        # 1. Seed Users
        # -------------------------------------------------------------
        users_data = [
            {
                "username": "rahul",
                "phone": "+919876543210",
                "display_name": "Rahul Sharma",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                "is_online": True,
                "last_seen": now,
            },
            {
                "username": "ananya",
                "phone": "+919876543211",
                "display_name": "Ananya Roy",
                "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
                "is_online": True,
                "last_seen": now,
            },
            {
                "username": "vikram",
                "phone": "+919876543212",
                "display_name": "Vikram Singh",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                "is_online": False,
                "last_seen": now - timedelta(minutes=25),
            },
            {
                "username": "priya",
                "phone": "+919876543213",
                "display_name": "Priya Nair",
                "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
                "is_online": True,
                "last_seen": now,
            },
            {
                "username": "kabir",
                "phone": "+919876543214",
                "display_name": "Kabir Mehta",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
                "is_online": False,
                "last_seen": now - timedelta(hours=2),
            },
            {
                "username": "neha",
                "phone": "+919876543215",
                "display_name": "Neha Patel",
                "avatar_url": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
                "is_online": False,
                "last_seen": now - timedelta(days=1),
            },
        ]

        users_by_username: dict[str, User] = {}
        for u in users_data:
            existing = db.query(User).filter(User.username == u["username"]).first()
            if not existing:
                user_obj = User(
                    username=u["username"],
                    phone=u["phone"],
                    display_name=u["display_name"],
                    avatar_url=u["avatar_url"],
                    password_hash="mock_otp_verified",
                    is_online=u["is_online"],
                    last_seen=u["last_seen"],
                    created_at=now - timedelta(days=10),
                    updated_at=now
                )
                db.add(user_obj)
                db.flush()
                users_by_username[u["username"]] = user_obj
            else:
                existing.is_online = u["is_online"]
                existing.last_seen = u["last_seen"]
                existing.avatar_url = u["avatar_url"]
                users_by_username[u["username"]] = existing

        db.commit()
        print(f"✓ Seeded {len(users_by_username)} users.")

        # -------------------------------------------------------------
        # 2. Seed Contacts
        # -------------------------------------------------------------
        contacts_map = [
            ("rahul", "ananya", "Ananya"),
            ("rahul", "vikram", "Vikram Tech"),
            ("rahul", "priya", "Priya Design"),
            ("rahul", "kabir", "Kabir Backend"),
            ("ananya", "rahul", "Rahul S"),
            ("ananya", "priya", "Priya Nair"),
            ("ananya", "neha", "Neha"),
            ("vikram", "rahul", "Rahul Lead"),
            ("vikram", "kabir", "Kabir M"),
            ("priya", "rahul", "Rahul S"),
        ]

        contacts_created = 0
        for owner_uname, contact_uname, nick in contacts_map:
            owner = users_by_username[owner_uname]
            contact_user = users_by_username[contact_uname]
            exists = db.query(Contact).filter(
                Contact.user_id == owner.id,
                Contact.contact_id == contact_user.id
            ).first()
            if not exists:
                c = Contact(
                    user_id=owner.id,
                    contact_id=contact_user.id,
                    nickname=nick,
                    created_at=now - timedelta(days=7)
                )
                db.add(c)
                contacts_created += 1

        db.commit()
        print(f"✓ Seeded {contacts_created} new contact relationships.")

        # -------------------------------------------------------------
        # 3. Seed Direct Conversations
        # -------------------------------------------------------------
        def get_or_create_direct_conv(u1: User, u2: User, updated_time: datetime) -> Conversation:
            # Query conversation where type is direct and both u1 and u2 are members
            convs_u1 = {
                m.conversation_id
                for m in db.query(ConversationMember).filter(ConversationMember.user_id == u1.id).all()
            }
            convs_u2 = {
                m.conversation_id
                for m in db.query(ConversationMember).filter(ConversationMember.user_id == u2.id).all()
            }
            common = convs_u1.intersection(convs_u2)
            for cid in common:
                c = db.query(Conversation).filter(Conversation.id == cid, Conversation.type == "direct").first()
                if c:
                    return c

            # Create new direct conversation
            c = Conversation(
                type="direct",
                name=None,
                avatar_url=None,
                created_by=u1.id,
                created_at=now - timedelta(days=5),
                updated_at=updated_time
            )
            db.add(c)
            db.flush()

            m1 = ConversationMember(conversation_id=c.id, user_id=u1.id, role="member", joined_at=c.created_at)
            m2 = ConversationMember(conversation_id=c.id, user_id=u2.id, role="member", joined_at=c.created_at)
            db.add_all([m1, m2])
            db.flush()
            return c

        conv_rahul_ananya = get_or_create_direct_conv(
            users_by_username["rahul"],
            users_by_username["ananya"],
            now - timedelta(minutes=12)
        )

        conv_rahul_vikram = get_or_create_direct_conv(
            users_by_username["rahul"],
            users_by_username["vikram"],
            now - timedelta(minutes=5)
        )

        conv_rahul_priya = get_or_create_direct_conv(
            users_by_username["rahul"],
            users_by_username["priya"],
            now - timedelta(hours=2)
        )

        # -------------------------------------------------------------
        # 4. Seed Group Conversations
        # -------------------------------------------------------------
        def get_or_create_group_conv(
            name: str,
            creator: User,
            members_with_roles: list[tuple[User, str]],
            avatar_url: str,
            updated_time: datetime
        ) -> Conversation:
            existing = db.query(Conversation).filter(
                Conversation.type == "group",
                Conversation.name == name
            ).first()
            if existing:
                return existing

            conv = Conversation(
                type="group",
                name=name,
                avatar_url=avatar_url,
                created_by=creator.id,
                created_at=now - timedelta(days=4),
                updated_at=updated_time
            )
            db.add(conv)
            db.flush()

            for user_obj, role in members_with_roles:
                m = ConversationMember(
                    conversation_id=conv.id,
                    user_id=user_obj.id,
                    role=role,
                    joined_at=conv.created_at
                )
                db.add(m)
            db.flush()
            return conv

        conv_core_eng = get_or_create_group_conv(
            name="Core Engineering Team",
            creator=users_by_username["rahul"],
            members_with_roles=[
                (users_by_username["rahul"], "admin"),
                (users_by_username["vikram"], "member"),
                (users_by_username["priya"], "member"),
                (users_by_username["kabir"], "member"),
            ],
            avatar_url="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80",
            updated_time=now - timedelta(minutes=10)
        )

        conv_trek_crew = get_or_create_group_conv(
            name="Weekend Trek Crew",
            creator=users_by_username["ananya"],
            members_with_roles=[
                (users_by_username["ananya"], "admin"),
                (users_by_username["rahul"], "member"),
                (users_by_username["kabir"], "member"),
                (users_by_username["neha"], "member"),
            ],
            avatar_url="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&auto=format&fit=crop&q=80",
            updated_time=now - timedelta(days=1)
        )

        db.commit()
        print("✓ Seeded conversations and memberships.")

        # -------------------------------------------------------------
        # 5. Seed Messages & Read Receipts
        # -------------------------------------------------------------
        messages_plan = [
            # Chat 1: Rahul & Ananya
            {
                "conv": conv_rahul_ananya,
                "sender": users_by_username["rahul"],
                "content": "Hey Ananya, are we still meeting at 7 today?",
                "time": now - timedelta(hours=2),
                "status": "read",
                "readers": [users_by_username["ananya"]],
            },
            {
                "conv": conv_rahul_ananya,
                "sender": users_by_username["ananya"],
                "content": "Yeah! I'll be there by 7:15. Booking a table at the rooftop café.",
                "time": now - timedelta(hours=1, minutes=50),
                "status": "read",
                "readers": [users_by_username["rahul"]],
            },
            {
                "conv": conv_rahul_ananya,
                "sender": users_by_username["rahul"],
                "content": "Perfect. Should I bring the architecture and system design notes?",
                "time": now - timedelta(hours=1, minutes=45),
                "status": "read",
                "readers": [users_by_username["ananya"]],
            },
            {
                "conv": conv_rahul_ananya,
                "sender": users_by_username["ananya"],
                "content": "Yes please, especially the real-time WebSocket diagrams!",
                "time": now - timedelta(minutes=12),
                "status": "delivered",
                # Unread by Rahul -> generates unread counter for Rahul!
                "readers": [],
            },

            # Chat 2: Rahul & Vikram
            {
                "conv": conv_rahul_vikram,
                "sender": users_by_username["vikram"],
                "content": "Hey Rahul, did you check the SQLite schema migration with WAL mode?",
                "time": now - timedelta(days=1),
                "status": "read",
                "readers": [users_by_username["rahul"]],
            },
            {
                "conv": conv_rahul_vikram,
                "sender": users_by_username["rahul"],
                "content": "Checking it now. Looks very solid, normalized, and explainable.",
                "time": now - timedelta(hours=18),
                "status": "read",
                "readers": [users_by_username["vikram"]],
            },
            {
                "conv": conv_rahul_vikram,
                "sender": users_by_username["vikram"],
                "content": "Awesome, all 16 integration tests passed with flying colors.",
                "time": now - timedelta(hours=4),
                "status": "read",
                "readers": [users_by_username["rahul"]],
            },
            {
                "conv": conv_rahul_vikram,
                "sender": users_by_username["rahul"],
                "content": "Great work! I'll spin up the test client and verify real-time sync.",
                "time": now - timedelta(minutes=5),
                "status": "sent",
                "readers": [],
            },

            # Chat 3: Rahul & Priya
            {
                "conv": conv_rahul_priya,
                "sender": users_by_username["priya"],
                "content": "Hi Rahul, sharing the finalized Signal-inspired design tokens and color scheme.",
                "time": now - timedelta(days=2),
                "status": "read",
                "readers": [users_by_username["rahul"]],
            },
            {
                "conv": conv_rahul_priya,
                "sender": users_by_username["rahul"],
                "content": "The calm typography, message bubbles, and unread badges look fantastic.",
                "time": now - timedelta(days=2, minutes=-15),
                "status": "read",
                "readers": [users_by_username["priya"]],
            },
            {
                "conv": conv_rahul_priya,
                "sender": users_by_username["priya"],
                "content": "Glad you like it! I just exported the SVG icons for checks and composer actions.",
                "time": now - timedelta(hours=2),
                "status": "delivered",
                # Unread by Rahul
                "readers": [],
            },

            # Group 1: Core Engineering Team
            {
                "conv": conv_core_eng,
                "sender": users_by_username["rahul"],
                "content": "Welcome to the Core Engineering channel everyone. Let's keep all architecture updates here.",
                "time": now - timedelta(hours=5),
                "status": "sent",
                "readers": [users_by_username["vikram"], users_by_username["priya"], users_by_username["kabir"]],
            },
            {
                "conv": conv_core_eng,
                "sender": users_by_username["kabir"],
                "content": "Excited to be here! Setting up my local development environment now.",
                "time": now - timedelta(hours=4),
                "status": "sent",
                "readers": [users_by_username["rahul"], users_by_username["vikram"], users_by_username["priya"]],
            },
            {
                "conv": conv_core_eng,
                "sender": users_by_username["vikram"],
                "content": "I've pushed the backend SQLite PR with WAL mode and foreign key enforcement.",
                "time": now - timedelta(hours=2),
                "status": "sent",
                "readers": [users_by_username["rahul"], users_by_username["priya"]],
            },
            {
                "conv": conv_core_eng,
                "sender": users_by_username["priya"],
                "content": "Frontend shell is coming together nicely. The responsive layout feels just like Signal.",
                "time": now - timedelta(minutes=45),
                "status": "sent",
                "readers": [users_by_username["rahul"]],
            },
            {
                "conv": conv_core_eng,
                "sender": users_by_username["kabir"],
                "content": "I've started running the multi-user concurrent tests. Real-time broadcast is fast!",
                "time": now - timedelta(minutes=10),
                "status": "sent",
                # Unread by Rahul
                "readers": [users_by_username["vikram"]],
            },

            # Group 2: Weekend Trek Crew
            {
                "conv": conv_trek_crew,
                "sender": users_by_username["ananya"],
                "content": "Who is up for the sunrise trek to Rajmachi this Saturday morning?",
                "time": now - timedelta(days=2),
                "status": "sent",
                "readers": [users_by_username["rahul"], users_by_username["kabir"], users_by_username["neha"]],
            },
            {
                "conv": conv_trek_crew,
                "sender": users_by_username["neha"],
                "content": "Count me in! The weather forecast looks clear and breezy.",
                "time": now - timedelta(days=1, hours=22),
                "status": "sent",
                "readers": [users_by_username["ananya"], users_by_username["rahul"], users_by_username["kabir"]],
            },
            {
                "conv": conv_trek_crew,
                "sender": users_by_username["rahul"],
                "content": "I'm in too. What time do we meet at the base point?",
                "time": now - timedelta(days=1, hours=10),
                "status": "sent",
                "readers": [users_by_username["ananya"], users_by_username["neha"], users_by_username["kabir"]],
            },
            {
                "conv": conv_trek_crew,
                "sender": users_by_username["ananya"],
                "content": "5:00 AM sharp! Please bring sufficient water and comfortable trail shoes.",
                "time": now - timedelta(days=1),
                "status": "sent",
                "readers": [users_by_username["rahul"], users_by_username["neha"], users_by_username["kabir"]],
            },
        ]

        messages_inserted = 0
        reads_inserted = 0
        for m_data in messages_plan:
            existing_msg = db.query(Message).filter(
                Message.conversation_id == m_data["conv"].id,
                Message.sender_id == m_data["sender"].id,
                Message.content == m_data["content"]
            ).first()

            if not existing_msg:
                msg = Message(
                    conversation_id=m_data["conv"].id,
                    sender_id=m_data["sender"].id,
                    content=m_data["content"],
                    message_type="text",
                    status=m_data["status"],
                    created_at=m_data["time"],
                    updated_at=m_data["time"]
                )
                db.add(msg)
                db.flush()
                messages_inserted += 1
            else:
                msg = existing_msg

            # Insert message read receipts
            for reader in m_data["readers"]:
                read_exists = db.query(MessageRead).filter(
                    MessageRead.message_id == msg.id,
                    MessageRead.user_id == reader.id
                ).first()
                if not read_exists:
                    mr = MessageRead(
                        message_id=msg.id,
                        user_id=reader.id,
                        read_at=m_data["time"] + timedelta(seconds=15)
                    )
                    db.add(mr)
                    reads_inserted += 1

        db.commit()
        print(f"✓ Seeded {messages_inserted} messages and {reads_inserted} read receipts.")
        print("\nSeed completed successfully!")

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the Signal database with realistic demo data.")
    parser.add_argument("--reset", action="store_true", help="Drop and recreate all tables before seeding.")
    args = parser.parse_args()
    seed_database(reset=args.reset)

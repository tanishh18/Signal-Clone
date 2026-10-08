import json
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import (
    User, Conversation, ConversationMember, Message, MessageRead, utc_now
)
from app.auth import decode_access_token
from app.services.conversation_service import is_conversation_member
from app.websocket.manager import manager

logger = logging.getLogger("websocket")
router = APIRouter(tags=["WebSocket"])


def get_conversation_member_ids(db: Session, conversation_id: int) -> list[int]:
    """Helper to fetch member user IDs for a conversation."""
    return [
        uid for (uid,) in db.query(ConversationMember.user_id).filter(
            ConversationMember.conversation_id == conversation_id
        ).all()
    ]


def get_related_user_ids(db: Session, user_id: int) -> list[int]:
    """
    Finds all unique user IDs that share at least one conversation
    with the given user for presence fan-out.
    """
    my_conv_ids = db.query(ConversationMember.conversation_id).filter(
        ConversationMember.user_id == user_id
    ).scalar_subquery()

    peer_ids = db.query(ConversationMember.user_id).filter(
        ConversationMember.conversation_id.in_(my_conv_ids),
        ConversationMember.user_id != user_id
    ).distinct().all()

    return [uid for (uid,) in peer_ids]


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    Primary WebSocket connection endpoint.
    Authenticates user via the query parameter 'token' before accepting the socket.
    Rejects unauthorized, missing, or expired tokens immediately.
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify token
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub", 0))
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify user in database
    db: Session = SessionLocal()
    try:
        current_user = db.query(User).filter(User.id == user_id).first()
        if not current_user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_name = current_user.username
        user_display = current_user.display_name
        user_avatar = current_user.avatar_url
    finally:
        db.close()

    # Register connection in ConnectionManager
    is_first = await manager.connect(user_id, websocket)

    # If first connection, mark online and broadcast user.online
    if is_first:
        db = SessionLocal()
        try:
            db_user = db.query(User).filter(User.id == user_id).first()
            if db_user:
                db_user.is_online = True
                db_user.last_seen = utc_now()
                db.commit()

            peer_ids = get_related_user_ids(db, user_id)
            online_event = {
                "type": "user.online",
                "data": {
                    "user_id": user_id,
                    "username": user_name,
                    "display_name": user_display
                }
            }
            for pid in peer_ids:
                await manager.send_to_user(pid, online_event)
        finally:
            db.close()

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                event = json.loads(raw_text)
            except Exception:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "data": {"message": "Malformed JSON payload."}
                }))
                continue

            event_type = event.get("type")
            data = event.get("data", {})

            if event_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "data": {}}))
                continue

            # ---------------------------------------------------------
            # 1. MESSAGE SEND
            # ---------------------------------------------------------
            elif event_type == "message.send":
                conv_id = data.get("conversation_id")
                content = str(data.get("content", "")).strip()
                reply_to_id = data.get("reply_to_id")
                temp_id = data.get("temp_id")

                if not conv_id or not content:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "data": {"message": "Invalid message: missing conversation_id or content."}
                    }))
                    continue

                db = SessionLocal()
                try:
                    # Authorization check
                    if not is_conversation_member(db, conv_id, user_id):
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "data": {"message": "You are not a member of this conversation."}
                        }))
                        continue

                    # Persist message in SQLite
                    now = utc_now()
                    msg = Message(
                        conversation_id=conv_id,
                        sender_id=user_id,
                        content=content,
                        message_type="text",
                        status="sent",
                        reply_to_id=reply_to_id,
                        created_at=now,
                        updated_at=now
                    )
                    db.add(msg)

                    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
                    if conv:
                        conv.updated_at = now

                    # Fetch member IDs
                    member_ids = get_conversation_member_ids(db, conv_id)

                    # For direct conversation, if recipient is actively online, advance status to delivered
                    if conv and conv.type == "direct":
                        other_members = [uid for uid in member_ids if uid != user_id]
                        if other_members and manager.is_user_online(other_members[0]):
                            msg.status = "delivered"

                    db.commit()
                    db.refresh(msg)

                    message_payload = {
                        "type": "message.created",
                        "data": {
                            "id": msg.id,
                            "conversation_id": msg.conversation_id,
                            "sender_id": msg.sender_id,
                            "content": msg.content,
                            "message_type": msg.message_type,
                            "status": msg.status,
                            "reply_to_id": msg.reply_to_id,
                            "created_at": msg.created_at.isoformat(),
                            "updated_at": msg.updated_at.isoformat(),
                            "temp_id": temp_id,
                            "sender": {
                                "id": user_id,
                                "username": user_name,
                                "display_name": user_display,
                                "avatar_url": user_avatar
                            },
                            "reads": []
                        }
                    }

                    # Broadcast to all conversation members (including sender for multi-tab sync)
                    await manager.broadcast_to_conversation(member_ids, message_payload)

                    # If delivered, emit message.delivered to sender
                    if msg.status == "delivered":
                        delivered_event = {
                            "type": "message.delivered",
                            "data": {
                                "conversation_id": conv_id,
                                "message_id": msg.id,
                                "user_id": other_members[0]
                            }
                        }
                        await manager.send_to_user(user_id, delivered_event)
                finally:
                    db.close()

            # ---------------------------------------------------------
            # 2. TYPING INDICATORS
            # ---------------------------------------------------------
            elif event_type in ("typing.start", "typing.stop"):
                conv_id = data.get("conversation_id")
                if not conv_id:
                    continue

                db = SessionLocal()
                try:
                    if not is_conversation_member(db, conv_id, user_id):
                        continue

                    member_ids = get_conversation_member_ids(db, conv_id)
                    typing_event = {
                        "type": event_type,
                        "data": {
                            "conversation_id": conv_id,
                            "user_id": user_id,
                            "username": user_name,
                            "display_name": user_display
                        }
                    }
                    # Broadcast only to OTHER members
                    await manager.broadcast_to_conversation(
                        member_ids, typing_event, exclude_user_id=user_id
                    )
                finally:
                    db.close()

            # ---------------------------------------------------------
            # 3. MESSAGE READ RECEIPT
            # ---------------------------------------------------------
            elif event_type == "message.read":
                conv_id = data.get("conversation_id")
                if not conv_id:
                    continue

                db = SessionLocal()
                try:
                    if not is_conversation_member(db, conv_id, user_id):
                        continue

                    # Mark unread messages from other senders as read
                    read_ids = db.query(MessageRead.message_id).filter(
                        MessageRead.user_id == user_id
                    ).scalar_subquery()

                    unread_msgs = db.query(Message).filter(
                        Message.conversation_id == conv_id,
                        Message.sender_id != user_id,
                        ~Message.id.in_(read_ids)
                    ).all()

                    now = utc_now()
                    marked_count = 0
                    for m in unread_msgs:
                        mr = MessageRead(
                            message_id=m.id,
                            user_id=user_id,
                            read_at=now
                        )
                        db.add(mr)
                        marked_count += 1

                    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
                    if conv and conv.type == "direct":
                        for m in unread_msgs:
                            m.status = "read"

                    db.commit()

                    if marked_count > 0:
                        member_ids = get_conversation_member_ids(db, conv_id)
                        read_event = {
                            "type": "message.read",
                            "data": {
                                "conversation_id": conv_id,
                                "reader_id": user_id,
                                "read_at": now.isoformat(),
                                "marked_count": marked_count
                            }
                        }
                        await manager.broadcast_to_conversation(member_ids, read_event)
                finally:
                    db.close()

            # ---------------------------------------------------------
            # 4. MESSAGE DELIVERED
            # ---------------------------------------------------------
            elif event_type == "message.delivered":
                conv_id = data.get("conversation_id")
                msg_id = data.get("message_id")
                if not conv_id or not msg_id:
                    continue

                db = SessionLocal()
                try:
                    if not is_conversation_member(db, conv_id, user_id):
                        continue

                    msg = db.query(Message).filter(
                        Message.id == msg_id,
                        Message.conversation_id == conv_id
                    ).first()

                    if msg and msg.status == "sent":
                        msg.status = "delivered"
                        db.commit()

                        delivered_event = {
                            "type": "message.delivered",
                            "data": {
                                "conversation_id": conv_id,
                                "message_id": msg_id,
                                "user_id": user_id
                            }
                        }
                        if msg.sender_id:
                            await manager.send_to_user(msg.sender_id, delivered_event)
                finally:
                    db.close()

            else:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "data": {"message": f"Unsupported event type: '{event_type}'."}
                }))

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.warning(f"Unexpected WebSocket error for user {user_id}: {e}")
    finally:
        is_final = await manager.disconnect(user_id, websocket)
        if is_final:
            db = SessionLocal()
            try:
                db_user = db.query(User).filter(User.id == user_id).first()
                if db_user:
                    db_user.is_online = False
                    db_user.last_seen = utc_now()
                    db.commit()

                peer_ids = get_related_user_ids(db, user_id)
                offline_event = {
                    "type": "user.offline",
                    "data": {
                        "user_id": user_id,
                        "username": user_name,
                        "last_seen": db_user.last_seen.isoformat() if db_user and db_user.last_seen else None
                    }
                }
                for pid in peer_ids:
                    await manager.send_to_user(pid, offline_event)
            finally:
                db.close()

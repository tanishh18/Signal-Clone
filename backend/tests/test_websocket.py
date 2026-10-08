import json
import time
import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import app
from app.auth import create_access_token
from app.database import Base, get_db
from app.models import User, Conversation, ConversationMember, Message
from seed import seed_database


@pytest.fixture(autouse=True)
def setup_seeded_db():
    seed_database(reset=True)


def get_token(username: str) -> str:
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(username=username).first()
        assert user is not None
        return create_access_token({"sub": str(user.id), "username": user.username})
    finally:
        db.close()


def get_direct_conv_id(u1: str, u2: str) -> int:
    from app.database import SessionLocal
    from app.services.conversation_service import find_existing_direct_conversation
    db = SessionLocal()
    try:
        user1 = db.query(User).filter_by(username=u1).first()
        user2 = db.query(User).filter_by(username=u2).first()
        conv = find_existing_direct_conversation(db, user1.id, user2.id)
        assert conv is not None
        return conv.id
    finally:
        db.close()


def test_websocket_auth_rejects_missing_token():
    client = TestClient(app)
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/ws"):
            pass
    assert exc.value.code == 1008


def test_websocket_auth_rejects_invalid_token():
    client = TestClient(app)
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/ws?token=invalid.token.here"):
            pass
    assert exc.value.code == 1008


def test_websocket_ping_pong():
    client = TestClient(app)
    token = get_token("rahul")
    with client.websocket_connect(f"/ws?token={token}") as ws:
        ws.send_text(json.dumps({"type": "ping", "data": {}}))
        response = json.loads(ws.receive_text())
        assert response["type"] == "pong"


def test_websocket_realtime_two_user_messaging_and_presence():
    client = TestClient(app)
    token_rahul = get_token("rahul")
    token_ananya = get_token("ananya")
    conv_id = get_direct_conv_id("rahul", "ananya")

    # Connect Rahul first
    with client.websocket_connect(f"/ws?token={token_rahul}") as ws_rahul:
        # Connect Ananya second
        with client.websocket_connect(f"/ws?token={token_ananya}") as ws_ananya:
            # 1. Real-time Presence: Rahul receives user.online event for Ananya
            presence_evt = json.loads(ws_rahul.receive_text())
            assert presence_evt["type"] == "user.online"
            assert presence_evt["data"]["username"] == "ananya"

            # 2. Rahul sends a message
            send_payload = {
                "type": "message.send",
                "data": {
                    "conversation_id": conv_id,
                    "content": "Hey Ananya, are you free?",
                    "temp_id": "temp-123"
                }
            }
            ws_rahul.send_text(json.dumps(send_payload))

            # Rahul receives his own message.created (for multi-tab / optimistic UI reconciliation)
            rahul_event = json.loads(ws_rahul.receive_text())
            assert rahul_event["type"] == "message.created"
            assert rahul_event["data"]["content"] == "Hey Ananya, are you free?"
            assert rahul_event["data"]["temp_id"] == "temp-123"
            msg_id = rahul_event["data"]["id"]

            # Ananya receives message.created in real time
            ananya_event = json.loads(ws_ananya.receive_text())
            assert ananya_event["type"] == "message.created"
            assert ananya_event["data"]["id"] == msg_id
            assert ananya_event["data"]["sender"]["username"] == "rahul"

            # Rahul receives delivery confirmation because Ananya is actively online
            delivery_event = json.loads(ws_rahul.receive_text())
            assert delivery_event["type"] == "message.delivered"
            assert delivery_event["data"]["message_id"] == msg_id

            # 3. Ananya replies in real time
            reply_payload = {
                "type": "message.send",
                "data": {
                    "conversation_id": conv_id,
                    "content": "Yeah, what's up?",
                    "temp_id": "temp-456"
                }
            }
            ws_ananya.send_text(json.dumps(reply_payload))

            # Ananya receives message.created
            ananya_reply_evt = json.loads(ws_ananya.receive_text())
            assert ananya_reply_evt["type"] == "message.created"
            reply_msg_id = ananya_reply_evt["data"]["id"]

            # Rahul receives reply message.created
            rahul_reply_evt = json.loads(ws_rahul.receive_text())
            assert rahul_reply_evt["type"] == "message.created"
            assert rahul_reply_evt["data"]["id"] == reply_msg_id
            assert rahul_reply_evt["data"]["content"] == "Yeah, what's up?"


def test_websocket_typing_indicator_targeting():
    client = TestClient(app)
    token_rahul = get_token("rahul")
    token_ananya = get_token("ananya")
    conv_id = get_direct_conv_id("rahul", "ananya")

    with client.websocket_connect(f"/ws?token={token_rahul}") as ws_rahul:
        with client.websocket_connect(f"/ws?token={token_ananya}") as ws_ananya:
            # Drain initial user.online presence event received by Rahul
            init_evt = json.loads(ws_rahul.receive_text())
            assert init_evt["type"] == "user.online"

            # Rahul starts typing
            ws_rahul.send_text(json.dumps({
                "type": "typing.start",
                "data": {"conversation_id": conv_id}
            }))
            time.sleep(0.05)

            # Ananya receives typing.start
            evt = json.loads(ws_ananya.receive_text())
            assert evt["type"] == "typing.start"
            assert evt["data"]["username"] == "rahul"

            # Rahul stops typing
            ws_rahul.send_text(json.dumps({
                "type": "typing.stop",
                "data": {"conversation_id": conv_id}
            }))
            time.sleep(0.05)
            evt_stop = json.loads(ws_ananya.receive_text())
            assert evt_stop["type"] == "typing.stop"
            assert evt_stop["data"]["user_id"] == evt["data"]["user_id"]


def test_websocket_authorization_rejects_unauthorized_conversation():
    client = TestClient(app)
    token_neha = get_token("neha")
    conv_id = get_direct_conv_id("rahul", "ananya")  # Neha is not a member

    with client.websocket_connect(f"/ws?token={token_neha}") as ws_neha:
        # Neha attempts to send message to private chat
        ws_neha.send_text(json.dumps({
            "type": "message.send",
            "data": {
                "conversation_id": conv_id,
                "content": "Intruder message"
            }
        }))
        err = json.loads(ws_neha.receive_text())
        assert err["type"] == "error"
        assert "not a member" in err["data"]["message"].lower()


def test_websocket_read_receipt_flow():
    client = TestClient(app)
    token_rahul = get_token("rahul")
    token_ananya = get_token("ananya")
    conv_id = get_direct_conv_id("rahul", "ananya")

    with client.websocket_connect(f"/ws?token={token_rahul}") as ws_rahul:
        with client.websocket_connect(f"/ws?token={token_ananya}") as ws_ananya:
            # Drain initial user.online presence event
            json.loads(ws_rahul.receive_text())

            # Rahul marks conversation as read
            ws_rahul.send_text(json.dumps({
                "type": "message.read",
                "data": {"conversation_id": conv_id}
            }))
            time.sleep(0.05)

            # Both receive message.read confirmation
            evt_rahul = json.loads(ws_rahul.receive_text())
            assert evt_rahul["type"] == "message.read"
            assert evt_rahul["data"]["conversation_id"] == conv_id

            evt_ananya = json.loads(ws_ananya.receive_text())
            assert evt_ananya["type"] == "message.read"
            assert evt_ananya["data"]["conversation_id"] == conv_id


def test_websocket_multiple_tabs_same_user():
    client = TestClient(app)
    token_rahul = get_token("rahul")
    token_ananya = get_token("ananya")
    conv_id = get_direct_conv_id("rahul", "ananya")

    # Rahul opens two tabs concurrently
    with client.websocket_connect(f"/ws?token={token_rahul}") as ws_rahul_tab1:
        with client.websocket_connect(f"/ws?token={token_rahul}") as ws_rahul_tab2:
            with client.websocket_connect(f"/ws?token={token_ananya}") as ws_ananya:
                # Drain initial user.online presence events received by Rahul's tabs
                json.loads(ws_rahul_tab1.receive_text())
                json.loads(ws_rahul_tab2.receive_text())

                # Ananya sends a message
                ws_ananya.send_text(json.dumps({
                    "type": "message.send",
                    "data": {
                        "conversation_id": conv_id,
                        "content": "Message for all your devices!"
                    }
                }))
                time.sleep(0.05)

                # BOTH tabs for Rahul must receive the message!
                tab1_evt = json.loads(ws_rahul_tab1.receive_text())
                tab2_evt = json.loads(ws_rahul_tab2.receive_text())
                assert tab1_evt["type"] == "message.created"
                assert tab2_evt["type"] == "message.created"
                assert tab1_evt["data"]["content"] == "Message for all your devices!"
                assert tab2_evt["data"]["content"] == "Message for all your devices!"
                assert tab2_evt["type"] == "message.created"
                assert tab1_evt["data"]["content"] == "Message for all your devices!"
                assert tab2_evt["data"]["content"] == "Message for all your devices!"

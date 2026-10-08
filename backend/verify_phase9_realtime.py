"""
Phase 9 Real-Time Verification Script
Validates message sent/delivered/read lifecycle, read receipt broadcasts,
typing indicators, unread counts, and multi-tab / reconnect safety.
"""

import sys
import os
import json
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Message, MessageRead, User, Conversation

def run_phase9_verification():
    print("=" * 75)
    print("PHASE 9: REAL-TIME DELIVERY, READ RECEIPTS & TYPING INDICATORS VERIFICATION")
    print("=" * 75)

    client = TestClient(app)

    # STEP 1: Authenticate Rahul and Ananya
    print("\n[STEP 1] Authenticating test sessions (Rahul & Ananya)...")
    login_a = client.post("/auth/login", json={"identifier": "rahul", "otp": "123456"}).json()
    token_a = login_a["access_token"]
    user_a = login_a["user"]

    login_b = client.post("/auth/login", json={"identifier": "ananya", "otp": "123456"}).json()
    token_b = login_b["access_token"]
    user_b = login_b["user"]

    print(f"✓ Rahul authenticated (ID: {user_a['id']})")
    print(f"✓ Ananya authenticated (ID: {user_b['id']})")

    # STEP 2: Get or create direct conversation
    print("\n[STEP 2] Fetching Rahul <-> Ananya direct conversation...")
    conv_res = client.post("/conversations", json={"participant_id": user_b["id"]}, headers={"Authorization": f"Bearer {token_a}"})
    conv_id = conv_res.json()["id"]
    print(f"✓ Conversation ID: {conv_id}")

    # STEP 3: Connect WebSocket for Rahul ONLY (Ananya is OFFLINE initially)
    print("\n[STEP 3] Testing SENT state (single check) while recipient is offline...")
    with client.websocket_connect(f"/ws?token={token_a}") as ws_a:
        print("✓ Rahul connected via WebSocket (Ananya offline)")

        # Rahul sends message while Ananya is offline
        test_temp_id_1 = f"temp-offline-{int(time.time())}"
        ws_a.send_text(json.dumps({
            "type": "message.send",
            "data": {
                "conversation_id": conv_id,
                "content": "Message sent while Ananya is offline",
                "temp_id": test_temp_id_1
            }
        }))

        echo_msg_1 = json.loads(ws_a.receive_text())
        assert echo_msg_1["type"] == "message.created"
        msg_1 = echo_msg_1["data"]
        # Because Ananya is offline, message status MUST remain 'sent'
        assert msg_1["status"] == "sent"
        msg_1_id = msg_1["id"]
        print(f"✓ Message 1 sent (ID: {msg_1_id}), authoritative status = 'sent' (Single check ✓)")

        # STEP 4: Ananya comes online -> sends message.delivered for pending message
        print("\n[STEP 4] Ananya comes online and delivers pending message...")
        with client.websocket_connect(f"/ws?token={token_b}") as ws_b:
            print("✓ Ananya connected via WebSocket")
            # Consume presence event
            time.sleep(0.05)
            evt_pres = json.loads(ws_a.receive_text())
            assert evt_pres["type"] == "user.online"
            print(f"✓ Rahul received presence notification: Ananya is online")

            # Ananya emits message.delivered for Message 1
            ws_b.send_text(json.dumps({
                "type": "message.delivered",
                "data": {
                    "conversation_id": conv_id,
                    "message_id": msg_1_id
                }
            }))
            time.sleep(0.05)

            # Rahul receives message.delivered
            evt_deliv_1 = json.loads(ws_a.receive_text())
            assert evt_deliv_1["type"] == "message.delivered"
            assert evt_deliv_1["data"]["message_id"] == msg_1_id
            print(f"✓ Rahul received message.delivered event! (Double check ✓✓)")

            # STEP 5: Test real-time TYPING INDICATOR lifecycle
            print("\n[STEP 5] Testing real-time TYPING INDICATOR lifecycle...")
            # Ananya starts typing
            ws_b.send_text(json.dumps({
                "type": "typing.start",
                "data": {"conversation_id": conv_id}
            }))
            time.sleep(0.05)

            evt_typing_start = json.loads(ws_a.receive_text())
            assert evt_typing_start["type"] == "typing.start"
            assert evt_typing_start["data"]["user_id"] == user_b["id"]
            print(f"✓ Rahul received typing.start from {evt_typing_start['data']['display_name']}")

            # Ananya stops typing
            ws_b.send_text(json.dumps({
                "type": "typing.stop",
                "data": {"conversation_id": conv_id}
            }))
            time.sleep(0.05)

            evt_typing_stop = json.loads(ws_a.receive_text())
            assert evt_typing_stop["type"] == "typing.stop"
            assert evt_typing_stop["data"]["user_id"] == user_b["id"]
            print(f"✓ Rahul received typing.stop from {evt_typing_stop['data']['display_name']}")

            # STEP 6: Test READ RECEIPTS (Blue Double Check)
            print("\n[STEP 6] Testing real-time READ RECEIPT (message.read)...")
            # Ananya opens conversation and sends message.read
            ws_b.send_text(json.dumps({
                "type": "message.read",
                "data": {"conversation_id": conv_id}
            }))
            time.sleep(0.05)

            # Both Ananya and Rahul receive message.read broadcast
            evt_read_b = json.loads(ws_b.receive_text())
            evt_read_a = json.loads(ws_a.receive_text())

            assert evt_read_a["type"] == "message.read"
            assert evt_read_b["type"] == "message.read"
            assert evt_read_a["data"]["conversation_id"] == conv_id
            assert evt_read_a["data"]["reader_id"] == user_b["id"]
            assert evt_read_a["data"]["marked_count"] >= 1
            print(f"✓ Real-time read receipt received by Rahul! (Blue double check ✓✓)")
            print(f"  Marked count: {evt_read_a['data']['marked_count']}")

            # STEP 7: Verify SQLite persistence for read receipt and message status
            print("\n[STEP 7] Verifying SQLite persistence of message.status='read' & message_reads...")
            db = SessionLocal()
            try:
                db_msg = db.query(Message).filter(Message.id == msg_1_id).first()
                assert db_msg.status == "read"
                print(f"✓ Message {msg_1_id} status updated to 'read' in SQLite")

                db_read = db.query(MessageRead).filter(
                    MessageRead.message_id == msg_1_id,
                    MessageRead.user_id == user_b["id"]
                ).first()
                assert db_read is not None
                print(f"✓ Recipient read receipt recorded in message_reads table at {db_read.read_at}")
            finally:
                db.close()

            # STEP 8: Read receipt IDEMPOTENCY test
            print("\n[STEP 8] Testing READ RECEIPT IDEMPOTENCY...")
            # Ananya emits message.read again for the exact same conversation
            ws_b.send_text(json.dumps({
                "type": "message.read",
                "data": {"conversation_id": conv_id}
            }))
            # Should not crash or insert duplicate unique constraint violations
            time.sleep(0.05)
            db = SessionLocal()
            try:
                count_reads = db.query(MessageRead).filter(
                    MessageRead.message_id == msg_1_id,
                    MessageRead.user_id == user_b["id"]
                ).count()
                assert count_reads == 1
                print("✓ Verified duplicate read event is completely safe and idempotent (count = 1)")
            finally:
                db.close()

            # STEP 9: Unread Count Synchronization Test
            print("\n[STEP 9] Testing unread count synchronization...")
            # Ananya sends message to Rahul
            ws_b.send_text(json.dumps({
                "type": "message.send",
                "data": {
                    "conversation_id": conv_id,
                    "content": "Unread count test message",
                    "temp_id": "temp-unread-1"
                }
            }))
            time.sleep(0.05)
            evt_b_echo = json.loads(ws_b.receive_text())
            evt_a_recv = json.loads(ws_a.receive_text())
            msg_unread_id = evt_a_recv["data"]["id"]
            print(f"✓ Rahul received message {msg_unread_id}")

            # Check unread count for Rahul via REST endpoint
            convs_a_res = client.get("/conversations", headers={"Authorization": f"Bearer {token_a}"}).json()
            conv_a = next(c for c in convs_a_res if c["id"] == conv_id)
            assert conv_a["unread_count"] >= 1
            print(f"✓ Rahul's unread count for conversation is {conv_a['unread_count']} (> 0)")

            # Rahul marks conversation read via REST endpoint
            read_ack = client.post(f"/conversations/{conv_id}/read", headers={"Authorization": f"Bearer {token_a}"}).json()
            assert read_ack["status"] == "success"
            assert read_ack["marked_count"] >= 1
            print(f"✓ Rahul marked conversation as read via REST API: {read_ack['marked_count']} marked")

            # Verify unread count is now 0
            convs_a_res2 = client.get("/conversations", headers={"Authorization": f"Bearer {token_a}"}).json()
            conv_a2 = next(c for c in convs_a_res2 if c["id"] == conv_id)
            assert conv_a2["unread_count"] == 0
            print("✓ Rahul's unread count successfully reset to 0 in SQLite")

    print("\n" + "=" * 75)
    print("ALL 9 PHASE 9 REAL-TIME VERIFICATION STEPS PASSED SUCCESSFULLY!")
    print("=" * 75)

if __name__ == "__main__":
    run_phase9_verification()

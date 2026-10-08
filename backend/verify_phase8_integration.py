"""
Phase 8 End-to-End Integration Verification Script
Simulates real-world two-user interactive messaging, OTP authentication,
session restoration, SQLite persistence, and duplicate-free real-time delivery.
"""

import sys
import os
import json
import time

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Message, User, Conversation

def run_phase8_verification():
    print("=" * 70)
    print("PHASE 8: ONE-TO-ONE MESSAGING INTEGRATION VERIFICATION")
    print("=" * 70)

    client = TestClient(app)

    # STEP 1: Verify health check
    print("\n[STEP 1] Checking API health...")
    res = client.get("/health")
    assert res.status_code == 200
    print("✓ API health OK")

    # STEP 2: Authenticate User A (Rahul) via Mock OTP flow
    print("\n[STEP 2] Requesting OTP & authenticating Rahul...")
    otp_res = client.post("/auth/request-otp", json={"identifier": "rahul"})
    assert otp_res.status_code == 200
    assert otp_res.json()["otp"] == "123456"
    print(f"✓ OTP requested: {otp_res.json()['otp']}")

    login_a = client.post("/auth/login", json={"identifier": "rahul", "otp": "123456"})
    assert login_a.status_code == 200
    token_a = login_a.json()["access_token"]
    user_a = login_a.json()["user"]
    print(f"✓ Rahul logged in (User ID: {user_a['id']}, display: '{user_a['display_name']}')")

    # STEP 3: Verify /users/me and /auth/me for User A
    print("\n[STEP 3] Verifying authenticated profile endpoints...")
    me_res = client.get("/users/me", headers={"Authorization": f"Bearer {token_a}"})
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "rahul"
    print("✓ GET /users/me authenticated profile matches Rahul")

    # STEP 4: Authenticate User B (Ananya) via Mock OTP flow
    print("\n[STEP 4] Authenticating Ananya...")
    login_b = client.post("/auth/login", json={"identifier": "ananya", "otp": "123456"})
    assert login_b.status_code == 200
    token_b = login_b.json()["access_token"]
    user_b = login_b.json()["user"]
    print(f"✓ Ananya logged in (User ID: {user_b['id']}, display: '{user_b['display_name']}')")

    # STEP 5: Verify conversation list for Rahul
    print("\n[STEP 5] Fetching Rahul's conversations...")
    convs_a = client.get("/conversations", headers={"Authorization": f"Bearer {token_a}"}).json()
    assert len(convs_a) >= 3
    print(f"✓ Rahul has {len(convs_a)} seeded conversations in sidebar")

    # Find Rahul <-> Ananya direct conversation
    conv_ananya = next((c for c in convs_a if any(m["user_id"] == user_b["id"] for m in c["members"])), None)
    assert conv_ananya is not None
    conv_ananya_id = conv_ananya["id"]
    print(f"✓ Found Rahul <-> Ananya conversation (ID: {conv_ananya_id})")

    # STEP 6: Load message history for Rahul <-> Ananya
    print("\n[STEP 6] Loading message history for Rahul <-> Ananya...")
    msgs_res = client.get(f"/conversations/{conv_ananya_id}/messages", headers={"Authorization": f"Bearer {token_a}"})
    assert msgs_res.status_code == 200
    msgs = msgs_res.json()
    assert len(msgs) > 0
    print(f"✓ Successfully loaded {len(msgs)} chronological messages")
    print(f"  First: '{msgs[0]['content']}'")
    print(f"  Last:  '{msgs[-1]['content']}'")

    # STEP 7: Connect WebSockets for both Rahul and Ananya
    print("\n[STEP 7] Establishing real-time WebSockets for Rahul and Ananya...")
    with client.websocket_connect(f"/ws?token={token_a}") as ws_a:
        print("✓ Rahul WebSocket connected")
        with client.websocket_connect(f"/ws?token={token_b}") as ws_b:
            print("✓ Ananya WebSocket connected")

            # Consume presence event
            time.sleep(0.05)
            evt_presence = json.loads(ws_a.receive_text())
            assert evt_presence["type"] == "user.online"
            print(f"✓ Real-time presence: user {evt_presence['data']['user_id']} ({evt_presence['data']['username']}) is online")

            # STEP 8: Rahul sends a real-time message to Ananya via WebSocket
            print("\n[STEP 8] Rahul sends: 'Hey Ananya, live real-time test from Phase 8!'")
            client_temp_id = f"client-test-{int(time.time())}"
            ws_a.send_text(json.dumps({
                "type": "message.send",
                "data": {
                    "conversation_id": conv_ananya_id,
                    "content": "Hey Ananya, live real-time test from Phase 8!",
                    "temp_id": client_temp_id
                }
            }))

            # Both Rahul and Ananya receive message.created
            evt_msg_a = json.loads(ws_a.receive_text())
            evt_msg_b = json.loads(ws_b.receive_text())

            assert evt_msg_a["type"] == "message.created"
            assert evt_msg_b["type"] == "message.created"
            assert evt_msg_a["data"]["id"] == evt_msg_b["data"]["id"]
            new_msg_id = evt_msg_a["data"]["id"]
            assert evt_msg_a["data"]["temp_id"] == client_temp_id
            print(f"✓ Real-time message delivered to both sessions (Server Msg ID: {new_msg_id})")
            print(f"  Optimistic temp_id reconciled: {client_temp_id} -> {new_msg_id}")

            # Delivery confirmation to Rahul since Ananya is actively online
            evt_deliv_a = json.loads(ws_a.receive_text())
            assert evt_deliv_a["type"] == "message.delivered"
            print(f"✓ Rahul received real-time delivery confirmation for msg {new_msg_id}")

            # STEP 9: Ananya sends a reply back to Rahul
            print("\n[STEP 9] Ananya replies: 'Received instantly, Rahul! No page refresh needed.'")
            reply_temp_id = f"client-reply-{int(time.time())}"
            ws_b.send_text(json.dumps({
                "type": "message.send",
                "data": {
                    "conversation_id": conv_ananya_id,
                    "content": "Received instantly, Rahul! No page refresh needed.",
                    "temp_id": reply_temp_id
                }
            }))

            evt_reply_b = json.loads(ws_b.receive_text())
            evt_reply_a = json.loads(ws_a.receive_text())

            assert evt_reply_a["type"] == "message.created"
            assert evt_reply_b["type"] == "message.created"
            reply_msg_id = evt_reply_a["data"]["id"]
            print(f"✓ Rahul received Ananya's reply in real-time (Server Msg ID: {reply_msg_id})")

            # Delivery confirmation to Ananya since Rahul is actively online
            evt_deliv_b = json.loads(ws_b.receive_text())
            assert evt_deliv_b["type"] == "message.delivered"
            print(f"✓ Ananya received real-time delivery confirmation for msg {reply_msg_id}")

    # STEP 10: Verify persistence in SQLite
    print("\n[STEP 10] Verifying persistence in SQLite database...")
    db = SessionLocal()
    try:
        persisted_1 = db.query(Message).filter(Message.id == new_msg_id).first()
        assert persisted_1 is not None
        assert persisted_1.content == "Hey Ananya, live real-time test from Phase 8!"

        persisted_2 = db.query(Message).filter(Message.id == reply_msg_id).first()
        assert persisted_2 is not None
        assert persisted_2.content == "Received instantly, Rahul! No page refresh needed."
        print(f"✓ Verified both messages permanently persisted in SQLite (IDs: {new_msg_id}, {reply_msg_id})")
    finally:
        db.close()

    # STEP 11: Refresh verification (fetch messages from REST after WebSocket closed)
    print("\n[STEP 11] Simulating page refresh / history reload...")
    refreshed_msgs = client.get(f"/conversations/{conv_ananya_id}/messages", headers={"Authorization": f"Bearer {token_a}"}).json()
    refreshed_ids = [m["id"] for m in refreshed_msgs]
    assert new_msg_id in refreshed_ids
    assert reply_msg_id in refreshed_ids
    # Verify no duplicates
    assert len(refreshed_ids) == len(set(refreshed_ids))
    print(f"✓ Reloaded message history has {len(refreshed_msgs)} messages. No duplicates detected!")

    # STEP 12: Direct conversation duplicate prevention
    print("\n[STEP 12] Verifying direct conversation duplicate prevention...")
    dup_res = client.post("/conversations", json={"participant_id": user_b["id"]}, headers={"Authorization": f"Bearer {token_a}"})
    assert dup_res.status_code in (200, 201)
    assert dup_res.json()["id"] == conv_ananya_id
    print("✓ Successfully resolved to existing conversation without creating duplicates")

    # STEP 13: Clean logout
    print("\n[STEP 13] Verifying clean logout...")
    logout_res = client.post("/auth/logout", headers={"Authorization": f"Bearer {token_a}"})
    assert logout_res.status_code == 200
    print("✓ Rahul logged out successfully")

    print("\n" + "=" * 70)
    print("ALL 13 PHASE 8 INTEGRATION STEPS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_phase8_verification()

import json
import time
from fastapi.testclient import TestClient
from app.main import app
from seed import seed_database
from app.database import SessionLocal
from app.models import Message, User

def run_two_user_test():
    print("=" * 60)
    print("STARTING 13-STEP TWO-USER REAL-TIME WEBSOCKET VERIFICATION")
    print("=" * 60)

    # Clean seed
    seed_database(reset=True)
    client = TestClient(app)

    # STEP 1: Rahul logs in
    print("\n[STEP 1] Rahul logs in...")
    login_a = client.post("/auth/login", json={"identifier": "rahul", "otp": "123456"})
    assert login_a.status_code == 200
    token_a = login_a.json()["access_token"]
    user_a = login_a.json()["user"]
    print(f"✓ Rahul authenticated (ID: {user_a['id']}, display: {user_a['display_name']})")

    # STEP 2: Ananya logs in
    print("\n[STEP 2] Ananya logs in...")
    login_b = client.post("/auth/login", json={"identifier": "ananya", "otp": "123456"})
    assert login_b.status_code == 200
    token_b = login_b.json()["access_token"]
    user_b = login_b.json()["user"]
    print(f"✓ Ananya authenticated (ID: {user_b['id']}, display: {user_b['display_name']})")

    # Fetch conversation ID between Rahul and Ananya
    conv_res = client.post("/conversations", json={"participant_id": user_b["id"]}, headers={"Authorization": f"Bearer {token_a}"})
    conv_id = conv_res.json()["id"]
    print(f"✓ Direct Conversation ID: {conv_id}")

    # STEP 3: Both establish WebSocket connections
    print("\n[STEP 3] Establishing WebSocket connections for both sessions...")
    with client.websocket_connect(f"/ws?token={token_a}") as ws_a:
        print("✓ Session A (Rahul) WebSocket connected")
        with client.websocket_connect(f"/ws?token={token_b}") as ws_b:
            print("✓ Session B (Ananya) WebSocket connected")
            # Session A receives Ananya's user.online event
            evt_online = json.loads(ws_a.receive_text())
            assert evt_online["type"] == "user.online"
            print(f"✓ Session A received real-time presence: {evt_online['data']['username']} is online")

            # STEP 4: Rahul sends: "Hey Ananya, are you free?"
            print("\n[STEP 4] Rahul sends: 'Hey Ananya, are you free?' via WebSocket...")
            ws_a.send_text(json.dumps({
                "type": "message.send",
                "data": {
                    "conversation_id": conv_id,
                    "content": "Hey Ananya, are you free?",
                    "temp_id": "client-msg-1"
                }
            }))

            # Self-echo for Session A optimistic reconcile
            echo_a = json.loads(ws_a.receive_text())
            assert echo_a["type"] == "message.created"
            msg1_id = echo_a["data"]["id"]
            print(f"✓ Session A received message.created (ID: {msg1_id})")

            # STEP 5: Ananya receives the message WITHOUT REFRESHING
            print("\n[STEP 5] Ananya receives message WITHOUT REFRESHING...")
            msg_b = json.loads(ws_b.receive_text())
            assert msg_b["type"] == "message.created"
            assert msg_b["data"]["content"] == "Hey Ananya, are you free?"
            print(f"✓ Session B received: '{msg_b['data']['content']}' from {msg_b['data']['sender']['display_name']}")

            # Delivery confirmation to Rahul
            deliv_a = json.loads(ws_a.receive_text())
            assert deliv_a["type"] == "message.delivered"
            print(f"✓ Session A received delivery confirmation: message {deliv_a['data']['message_id']} delivered to user {deliv_a['data']['user_id']}")

            # STEP 6: Ananya replies: "Yeah, what's up?"
            print("\n[STEP 6] Ananya replies: 'Yeah, what's up?' via WebSocket...")
            ws_b.send_text(json.dumps({
                "type": "message.send",
                "data": {
                    "conversation_id": conv_id,
                    "content": "Yeah, what's up?",
                    "temp_id": "client-msg-2"
                }
            }))
            echo_b = json.loads(ws_b.receive_text())
            assert echo_b["type"] == "message.created"
            msg2_id = echo_b["data"]["id"]

            # STEP 7: Rahul receives reply WITHOUT REFRESHING
            print("\n[STEP 7] Rahul receives reply WITHOUT REFRESHING...")
            reply_a = json.loads(ws_a.receive_text())
            assert reply_a["type"] == "message.created"
            assert reply_a["data"]["content"] == "Yeah, what's up?"
            print(f"✓ Session A received: '{reply_a['data']['content']}' from {reply_a['data']['sender']['display_name']}")

            # Delivery confirmation to Ananya
            deliv_b = json.loads(ws_b.receive_text())
            assert deliv_b["type"] == "message.delivered"
            print(f"✓ Session B received delivery confirmation: message {deliv_b['data']['message_id']} delivered")

            # STEP 8: Test typing: Rahul starts typing -> Ananya sees typing indicator
            print("\n[STEP 8] Test typing: Rahul starts typing...")
            ws_a.send_text(json.dumps({
                "type": "typing.start",
                "data": {"conversation_id": conv_id}
            }))
            time.sleep(0.05)
            typing_b = json.loads(ws_b.receive_text())
            assert typing_b["type"] == "typing.start"
            assert typing_b["data"]["username"] == "rahul"
            print(f"✓ Session B received: '{typing_b['data']['display_name']} is typing...'")

            # Rahul stops typing
            ws_a.send_text(json.dumps({
                "type": "typing.stop",
                "data": {"conversation_id": conv_id}
            }))
            time.sleep(0.05)
            typing_stop_b = json.loads(ws_b.receive_text())
            assert typing_stop_b["type"] == "typing.stop"
            print("✓ Session B received: typing.stop event")

            # STEP 9: Test delivery (verified in Steps 4 & 6)
            print("\n[STEP 9] Delivery check: confirmed status='delivered'")

            # STEP 10: Test read: Ananya marks messages as read
            print("\n[STEP 10] Test read: Ananya marks messages as read...")
            ws_b.send_text(json.dumps({
                "type": "message.read",
                "data": {"conversation_id": conv_id}
            }))
            time.sleep(0.05)
            read_b = json.loads(ws_b.receive_text())
            read_a = json.loads(ws_a.receive_text())
            assert read_a["type"] == "message.read"
            print(f"✓ Session A received read receipt: Ananya read {read_a['data']['marked_count']} message(s)")

        # STEP 11: Close Ananya's connection -> Rahul receives offline event
        print("\n[STEP 11] Ananya disconnects. Checking presence event for Rahul...")
        offline_a = json.loads(ws_a.receive_text())
        assert offline_a["type"] == "user.offline"
        assert offline_a["data"]["username"] == "ananya"
        print(f"✓ Session A received presence: {offline_a['data']['username']} went offline")

        # STEP 12: Reconnect Ananya -> Rahul receives online event
        print("\n[STEP 12] Reconnect Ananya...")
        with client.websocket_connect(f"/ws?token={token_b}") as ws_b_reconnect:
            online_a_again = json.loads(ws_a.receive_text())
            assert online_a_again["type"] == "user.online"
            assert online_a_again["data"]["username"] == "ananya"
            print(f"✓ Session A received presence: {online_a_again['data']['username']} came back online")

    # STEP 13: Refresh simulation -> Read from SQLite database
    print("\n[STEP 13] Refresh simulation: Verifying messages persisted in SQLite...")
    db = SessionLocal()
    try:
        saved_m1 = db.query(Message).filter_by(id=msg1_id).first()
        saved_m2 = db.query(Message).filter_by(id=msg2_id).first()
        assert saved_m1 is not None and saved_m1.content == "Hey Ananya, are you free?"
        assert saved_m2 is not None and saved_m2.content == "Yeah, what's up?"
        print(f"✓ Message 1 persisted in SQLite: '{saved_m1.content}' (Status: {saved_m1.status})")
        print(f"✓ Message 2 persisted in SQLite: '{saved_m2.content}' (Status: {saved_m2.status})")
    finally:
        db.close()

    print("\n" + "=" * 60)
    print("ALL 13 STEPS VERIFIED AND COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_two_user_test()

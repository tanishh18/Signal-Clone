"""
Phase 10 Group Messaging & Group Management Verification Script
Validates:
1. Group creation (creator is admin, members added, name/avatar)
2. Admin permissions (add member, remove member, last-admin protection, non-admin 403)
3. Multi-user real-time group chat (Rahul, Ananya, Vikram)
4. Group typing indicators scoped to conversation
5. Real-time message broadcast without refresh to all active members
6. Sender display name and metadata
7. Per-user unread count & read receipt isolation
8. Removed member access revocation
9. SQLite persistence and history refresh
10. Regression check on 1-to-1 direct messaging
"""

import sys
import os
import json
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Conversation, ConversationMember, Message, MessageRead, User

def run_phase10_verification():
    print("=" * 80)
    print("PHASE 10: GROUP MESSAGING & GROUP MANAGEMENT VERIFICATION")
    print("=" * 80)

    client = TestClient(app)

    # -------------------------------------------------------------------------
    # STEP 1: Authenticate Rahul, Ananya, Vikram, and Priya
    # -------------------------------------------------------------------------
    print("\n[STEP 1] Authenticating test sessions (Rahul, Ananya, Vikram, Priya)...")
    login_rahul = client.post("/auth/login", json={"identifier": "rahul", "otp": "123456"}).json()
    token_rahul = login_rahul["access_token"]
    user_rahul = login_rahul["user"]

    login_ananya = client.post("/auth/login", json={"identifier": "ananya", "otp": "123456"}).json()
    token_ananya = login_ananya["access_token"]
    user_ananya = login_ananya["user"]

    login_vikram = client.post("/auth/login", json={"identifier": "vikram", "otp": "123456"}).json()
    token_vikram = login_vikram["access_token"]
    user_vikram = login_vikram["user"]

    login_priya = client.post("/auth/login", json={"identifier": "priya", "otp": "123456"}).json()
    token_priya = login_priya["access_token"]
    user_priya = login_priya["user"]

    print(f"✓ Rahul authenticated (ID: {user_rahul['id']})")
    print(f"✓ Ananya authenticated (ID: {user_ananya['id']})")
    print(f"✓ Vikram authenticated (ID: {user_vikram['id']})")
    print(f"✓ Priya authenticated (ID: {user_priya['id']})")

    # -------------------------------------------------------------------------
    # STEP 2: Group Creation
    # -------------------------------------------------------------------------
    print("\n[STEP 2] Creating group 'Project Falcon' (Rahul as creator/admin)...")
    group_res = client.post(
        "/groups",
        json={
            "name": "Project Falcon",
            "member_ids": [user_ananya["id"], user_vikram["id"]]
        },
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert group_res.status_code == 201, f"Expected 201, got {group_res.status_code}: {group_res.text}"
    group_data = group_res.json()
    group_id = group_data["id"]
    assert group_data["name"] == "Project Falcon"
    assert group_data["type"] == "group"
    assert group_data["created_by"] == user_rahul["id"]
    print(f"✓ Group created (ID: {group_id}, Name: '{group_data['name']}')")

    # Verify members and roles
    members_res = client.get(
        f"/groups/{group_id}/members",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert members_res.status_code == 200
    members = members_res.json()
    assert len(members) == 3
    rahul_member = next(m for m in members if m["user_id"] == user_rahul["id"])
    ananya_member = next(m for m in members if m["user_id"] == user_ananya["id"])
    vikram_member = next(m for m in members if m["user_id"] == user_vikram["id"])

    assert rahul_member["role"] == "admin", "Creator must be admin"
    assert ananya_member["role"] == "member", "Invited users must be member"
    assert vikram_member["role"] == "member", "Invited users must be member"
    print(f"✓ Verified membership: Rahul (Admin), Ananya (Member), Vikram (Member)")

    # -------------------------------------------------------------------------
    # STEP 3: Admin Authorization & Member Management
    # -------------------------------------------------------------------------
    print("\n[STEP 3] Verifying Admin Permissions & Member Management...")

    # 3a. Non-admin Ananya attempts to add Priya -> 403 Forbidden
    res_unauth_add = client.post(
        f"/groups/{group_id}/members",
        json={"user_id": user_priya["id"]},
        headers={"Authorization": f"Bearer {token_ananya}"}
    )
    assert res_unauth_add.status_code == 403
    print("✓ Non-admin add rejected with 403 Forbidden")

    # 3b. Non-admin Ananya attempts to remove Vikram -> 403 Forbidden
    res_unauth_del = client.delete(
        f"/groups/{group_id}/members/{user_vikram['id']}",
        headers={"Authorization": f"Bearer {token_ananya}"}
    )
    assert res_unauth_del.status_code == 403
    print("✓ Non-admin remove rejected with 403 Forbidden")

    # 3c. Admin Rahul adds Priya -> Success (201)
    res_admin_add = client.post(
        f"/groups/{group_id}/members",
        json={"user_id": user_priya["id"]},
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert res_admin_add.status_code == 201
    print("✓ Admin successfully added Priya to group")

    # Verify updated member count
    members_res_after_add = client.get(
        f"/groups/{group_id}/members",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert len(members_res_after_add.json()) == 4
    print("✓ Member count updated to 4")

    # 3d. Last-Admin Protection: Admin Rahul attempts to remove himself -> 400 Bad Request
    res_del_last_admin = client.delete(
        f"/groups/{group_id}/members/{user_rahul['id']}",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert res_del_last_admin.status_code == 400
    assert "only group admin" in res_del_last_admin.json()["detail"].lower()
    print("✓ Last-admin protection verified: cannot remove the only admin (400 Bad Request)")

    # 3e. Admin Rahul removes Priya -> Success (200)
    res_admin_del = client.delete(
        f"/groups/{group_id}/members/{user_priya['id']}",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert res_admin_del.status_code == 200
    print("✓ Admin successfully removed Priya from group")

    # Verify Priya is no longer in member list
    members_res_after_del = client.get(
        f"/groups/{group_id}/members",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert len(members_res_after_del.json()) == 3
    assert not any(m["user_id"] == user_priya["id"] for m in members_res_after_del.json())
    print("✓ Member count back to 3, Priya excluded")

    # 3f. Removed member Priya attempts to view history -> 403 Forbidden
    res_priya_hist = client.get(
        f"/conversations/{group_id}/messages",
        headers={"Authorization": f"Bearer {token_priya}"}
    )
    assert res_priya_hist.status_code == 403
    print("✓ Removed member access rejected with 403 Forbidden")

    # -------------------------------------------------------------------------
    # STEP 4: Real-Time 3-User WebSocket Group Messaging
    # -------------------------------------------------------------------------
    print("\n[STEP 4] Establishing 3-User WebSocket connections (Rahul, Ananya, Vikram)...")
    with client.websocket_connect(f"/ws?token={token_rahul}") as ws_rahul:
        with client.websocket_connect(f"/ws?token={token_ananya}") as ws_ananya:
            # Drain presence events
            time.sleep(0.05)
            evt_on_ananya = json.loads(ws_rahul.receive_text())
            assert evt_on_ananya["type"] == "user.online"

            with client.websocket_connect(f"/ws?token={token_vikram}") as ws_vikram:
                time.sleep(0.05)
                # Drain Vikram presence on Rahul and Ananya sockets
                evt_on_vikram_r = json.loads(ws_rahul.receive_text())
                evt_on_vikram_a = json.loads(ws_ananya.receive_text())
                assert evt_on_vikram_r["type"] == "user.online"
                assert evt_on_vikram_a["type"] == "user.online"
                print("✓ All 3 sessions actively connected over WebSockets")

                # STEP 4a: Group Typing Indicators
                print("\n[STEP 4a] Testing scoped group typing indicators...")
                ws_rahul.send_text(json.dumps({
                    "type": "typing.start",
                    "data": {"conversation_id": group_id}
                }))
                time.sleep(0.05)
                typ_a = json.loads(ws_ananya.receive_text())
                typ_v = json.loads(ws_vikram.receive_text())
                assert typ_a["type"] == "typing.start" and typ_a["data"]["conversation_id"] == group_id
                assert typ_v["type"] == "typing.start" and typ_v["data"]["conversation_id"] == group_id
                assert typ_a["data"]["display_name"] == "Rahul Sharma"
                print(f"✓ Ananya and Vikram both received typing.start from Rahul Sharma")

                ws_rahul.send_text(json.dumps({
                    "type": "typing.stop",
                    "data": {"conversation_id": group_id}
                }))
                time.sleep(0.05)
                typ_stop_a = json.loads(ws_ananya.receive_text())
                typ_stop_v = json.loads(ws_vikram.receive_text())
                assert typ_stop_a["type"] == "typing.stop"
                assert typ_stop_v["type"] == "typing.stop"
                print("✓ Ananya and Vikram received typing.stop from Rahul Sharma")

                # STEP 4b: Rahul sends group message
                print("\n[STEP 4b] Rahul sends: 'Hello Team Falcon! Let's get started.'")
                ws_rahul.send_text(json.dumps({
                    "type": "message.send",
                    "data": {
                        "conversation_id": group_id,
                        "content": "Hello Team Falcon! Let's get started.",
                        "temp_id": "temp-group-1"
                    }
                }))
                time.sleep(0.05)

                # Rahul receives self-echo
                echo_r1 = json.loads(ws_rahul.receive_text())
                assert echo_r1["type"] == "message.created"
                msg_1_id = echo_r1["data"]["id"]
                assert echo_r1["data"]["content"] == "Hello Team Falcon! Let's get started."
                assert echo_r1["data"]["status"] == "sent"

                # Ananya receives in real time WITHOUT REFRESH
                recv_a1 = json.loads(ws_ananya.receive_text())
                assert recv_a1["type"] == "message.created"
                assert recv_a1["data"]["id"] == msg_1_id
                assert recv_a1["data"]["sender"]["display_name"] == "Rahul Sharma"

                # Vikram receives in real time WITHOUT REFRESH
                recv_v1 = json.loads(ws_vikram.receive_text())
                assert recv_v1["type"] == "message.created"
                assert recv_v1["data"]["id"] == msg_1_id
                assert recv_v1["data"]["sender"]["display_name"] == "Rahul Sharma"
                print(f"✓ Rahul self-echoed, Ananya and Vikram received Message 1 in real time (ID: {msg_1_id})")

                # STEP 4c: Ananya replies
                print("\n[STEP 4c] Ananya replies: 'Ready on frontend!'")
                ws_ananya.send_text(json.dumps({
                    "type": "message.send",
                    "data": {
                        "conversation_id": group_id,
                        "content": "Ready on frontend!",
                        "temp_id": "temp-group-2"
                    }
                }))
                time.sleep(0.05)

                echo_a2 = json.loads(ws_ananya.receive_text())
                msg_2_id = echo_a2["data"]["id"]

                recv_r2 = json.loads(ws_rahul.receive_text())
                assert recv_r2["type"] == "message.created"
                assert recv_r2["data"]["id"] == msg_2_id
                assert recv_r2["data"]["sender"]["display_name"] == "Ananya Roy"

                recv_v2 = json.loads(ws_vikram.receive_text())
                assert recv_v2["type"] == "message.created"
                assert recv_v2["data"]["id"] == msg_2_id
                assert recv_v2["data"]["sender"]["display_name"] == "Ananya Roy"
                print(f"✓ Ananya self-echoed, Rahul and Vikram received Message 2 in real time (ID: {msg_2_id})")

                # STEP 4d: Vikram replies
                print("\n[STEP 4d] Vikram replies: 'Backend architecture ready!'")
                ws_vikram.send_text(json.dumps({
                    "type": "message.send",
                    "data": {
                        "conversation_id": group_id,
                        "content": "Backend architecture ready!",
                        "temp_id": "temp-group-3"
                    }
                }))
                time.sleep(0.05)

                echo_v3 = json.loads(ws_vikram.receive_text())
                msg_3_id = echo_v3["data"]["id"]

                recv_r3 = json.loads(ws_rahul.receive_text())
                assert recv_r3["type"] == "message.created"
                assert recv_r3["data"]["id"] == msg_3_id
                assert recv_r3["data"]["sender"]["display_name"] == "Vikram Singh"

                recv_a3 = json.loads(ws_ananya.receive_text())
                assert recv_a3["type"] == "message.created"
                assert recv_a3["data"]["id"] == msg_3_id
                assert recv_a3["data"]["sender"]["display_name"] == "Vikram Singh"
                print(f"✓ Vikram self-echoed, Rahul and Ananya received Message 3 in real time (ID: {msg_3_id})")

                # -------------------------------------------------------------
                # STEP 5: Per-User Read Receipts & Unread Count Isolation
                # -------------------------------------------------------------
                print("\n[STEP 5] Testing per-user read receipts & unread count isolation...")
                # Vikram has 2 unread messages (from Rahul and Ananya)
                convs_v = client.get("/conversations", headers={"Authorization": f"Bearer {token_vikram}"}).json()
                conv_v = next(c for c in convs_v if c["id"] == group_id)
                assert conv_v["unread_count"] == 2
                print(f"✓ Vikram's unread count is {conv_v['unread_count']} (2 unread)")

                # Vikram marks conversation as read via WebSocket
                ws_vikram.send_text(json.dumps({
                    "type": "message.read",
                    "data": {"conversation_id": group_id}
                }))
                time.sleep(0.05)

                read_broadcast_v = json.loads(ws_vikram.receive_text())
                read_broadcast_r = json.loads(ws_rahul.receive_text())
                read_broadcast_a = json.loads(ws_ananya.receive_text())
                assert read_broadcast_v["type"] == "message.read"
                assert read_broadcast_r["type"] == "message.read"
                assert read_broadcast_a["type"] == "message.read"
                assert read_broadcast_v["data"]["reader_id"] == user_vikram["id"]
                assert read_broadcast_v["data"]["marked_count"] == 2
                print(f"✓ Vikram marked {read_broadcast_v['data']['marked_count']} messages as read; receipt broadcast received by all 3")

                # Verify Vikram's unread count is now 0
                convs_v_after = client.get("/conversations", headers={"Authorization": f"Bearer {token_vikram}"}).json()
                conv_v_after = next(c for c in convs_v_after if c["id"] == group_id)
                assert conv_v_after["unread_count"] == 0
                print("✓ Vikram's unread count is now 0")

                # Verify group message status did NOT falsely change to 'read'
                db = SessionLocal()
                try:
                    db_m1 = db.query(Message).filter_by(id=msg_1_id).first()
                    assert db_m1.status == "sent", f"Group message status must remain sent, got {db_m1.status}"
                    print(f"✓ Verified group message {msg_1_id} status remains '{db_m1.status}' (per-user read isolation preserved)")

                    # Verify per-user read receipts in message_reads table
                    vikram_reads = db.query(MessageRead).filter_by(
                        user_id=user_vikram["id"],
                        message_id=msg_1_id
                    ).count()
                    assert vikram_reads == 1
                    print("✓ Verified individual recipient read record persisted in message_reads")
                finally:
                    db.close()

    # -------------------------------------------------------------------------
    # STEP 6: History Persistence & Refresh Simulation
    # -------------------------------------------------------------------------
    print("\n[STEP 6] History persistence & refresh simulation...")
    history_res = client.get(
        f"/conversations/{group_id}/messages",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert history_res.status_code == 200
    msgs = history_res.json()
    assert len(msgs) == 3
    assert msgs[0]["content"] == "Hello Team Falcon! Let's get started."
    assert msgs[1]["content"] == "Ready on frontend!"
    assert msgs[2]["content"] == "Backend architecture ready!"
    print(f"✓ Chronological message history preserved across refresh (3 messages returned)")

    # -------------------------------------------------------------------------
    # STEP 7: Regression Test: 1-to-1 Direct Messaging Integrity
    # -------------------------------------------------------------------------
    print("\n[STEP 7] Regression check: 1-to-1 Direct Messaging integrity...")
    direct_res = client.post(
        "/conversations",
        json={"participant_id": user_ananya["id"]},
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert direct_res.status_code in (200, 201)
    direct_id = direct_res.json()["id"]

    direct_msg_res = client.post(
        f"/conversations/{direct_id}/messages",
        json={"content": "Direct chat regression test"},
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert direct_msg_res.status_code == 201
    direct_msg = direct_msg_res.json()
    assert direct_msg["content"] == "Direct chat regression test"
    print(f"✓ Direct message created (ID: {direct_msg['id']}) in conversation {direct_id}")

    print("\n" + "=" * 80)
    print("ALL 7 PHASE 10 GROUP MESSAGING VERIFICATION STEPS PASSED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_phase10_verification()

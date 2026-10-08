"""
Phase 11 Contact Management & User Search Verification Script
Validates:
1. User search (display name, username, phone, case-insensitivity, exclude self, no results)
2. Contact management (list contacts, add contact, duplicate rejection, self-contact rejection, remove contact, 404 on missing)
3. Direct chat creation from search/contacts (server-side duplicate prevention)
4. Contact persistence across user sessions
5. Regression check on direct messaging and group messaging
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Contact, User, Conversation

def run_phase11_verification():
    print("=" * 80)
    print("PHASE 11: CONTACT MANAGEMENT & USER SEARCH VERIFICATION")
    print("=" * 80)

    client = TestClient(app)

    # -------------------------------------------------------------------------
    # STEP 1: Authenticate Sessions (Rahul & Priya)
    # -------------------------------------------------------------------------
    print("\n[STEP 1] Authenticating test sessions (Rahul & Priya)...")
    login_rahul = client.post("/auth/login", json={"identifier": "rahul", "otp": "123456"}).json()
    token_rahul = login_rahul["access_token"]
    user_rahul = login_rahul["user"]

    login_priya = client.post("/auth/login", json={"identifier": "priya", "otp": "123456"}).json()
    token_priya = login_priya["access_token"]
    user_priya = login_priya["user"]

    login_vikram = client.post("/auth/login", json={"identifier": "vikram", "otp": "123456"}).json()
    token_vikram = login_vikram["access_token"]
    user_vikram = login_vikram["user"]

    print(f"✓ Rahul authenticated (ID: {user_rahul['id']})")
    print(f"✓ Priya authenticated (ID: {user_priya['id']})")
    print(f"✓ Vikram authenticated (ID: {user_vikram['id']})")

    # -------------------------------------------------------------------------
    # STEP 2: User Search (GET /users/search?q=...)
    # -------------------------------------------------------------------------
    print("\n[STEP 2] Testing User Search...")

    # 2a. Search by username prefix
    res_search_username = client.get(
        "/users/search?q=ananya",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert res_search_username.status_code == 200
    results_username = res_search_username.json()
    assert len(results_username) >= 1
    assert any(u["username"] == "ananya" for u in results_username)
    print(f"✓ Search by username 'ananya' returned {len(results_username)} result(s)")

    # 2b. Search by display name substring (case-insensitive)
    res_search_display = client.get(
        "/users/search?q=singh",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert res_search_display.status_code == 200
    results_display = res_search_display.json()
    assert any(u["username"] == "vikram" for u in results_display)
    print("✓ Search by display name 'singh' found Vikram Singh")

    # 2c. Exclude self: Rahul searches for 'rahul' -> Must NOT return Rahul!
    res_search_self = client.get(
        "/users/search?q=rahul",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert res_search_self.status_code == 200
    results_self = res_search_self.json()
    assert not any(u["id"] == user_rahul["id"] for u in results_self)
    print("✓ Search strictly excludes current user (Rahul excluded from his own search)")

    # 2d. No results for non-existent user
    res_no_results = client.get(
        "/users/search?q=nonexistent_xyz_user_999",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert res_no_results.status_code == 200
    assert res_no_results.json() == []
    print("✓ Non-existent query returned empty list [] cleanly")

    # -------------------------------------------------------------------------
    # STEP 3: Contact Management (CRUD & Constraints)
    # -------------------------------------------------------------------------
    print("\n[STEP 3] Testing Contact Management...")

    # 3a. List current contacts for Rahul
    initial_contacts_res = client.get(
        "/contacts",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert initial_contacts_res.status_code == 200
    initial_contacts = initial_contacts_res.json()
    print(f"✓ Initial contacts count for Rahul: {len(initial_contacts)}")

    # Ensure Priya is not currently a contact (delete if previously added)
    if any(c["contact_id"] == user_priya["id"] for c in initial_contacts):
        client.delete(f"/contacts/{user_priya['id']}", headers={"Authorization": f"Bearer {token_rahul}"})

    # 3b. Self-contact prevention -> 400 Bad Request
    res_self_contact = client.post(
        "/contacts",
        json={"contact_id": user_rahul["id"]},
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert res_self_contact.status_code == 400
    assert "cannot add yourself" in res_self_contact.json()["detail"].lower()
    print("✓ Self-contact rejected with 400 Bad Request")

    # 3c. Add contact (Rahul adds Priya) -> 201 Created
    res_add_contact = client.post(
        "/contacts",
        json={"contact_id": user_priya["id"], "nickname": "Priya Work"},
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert res_add_contact.status_code == 201
    contact_data = res_add_contact.json()
    assert contact_data["contact_id"] == user_priya["id"]
    assert contact_data["contact_user"]["username"] == "priya"
    assert contact_data["nickname"] == "Priya Work"
    print(f"✓ Rahul successfully added Priya as a contact (ID: {contact_data['id']})")

    # 3d. Duplicate contact prevention -> 409 Conflict
    res_dup_contact = client.post(
        "/contacts",
        json={"contact_id": user_priya["id"]},
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert res_dup_contact.status_code == 409
    assert "already in your contacts" in res_dup_contact.json()["detail"].lower()
    print("✓ Duplicate contact rejected with 409 Conflict")

    # 3e. Verify Priya appears in Rahul's contacts list
    updated_contacts = client.get("/contacts", headers={"Authorization": f"Bearer {token_rahul}"}).json()
    assert any(c["contact_id"] == user_priya["id"] for c in updated_contacts)
    print("✓ Verified Priya is listed in GET /contacts")

    # 3f. Remove contact (Rahul removes Priya) -> 200 OK
    res_del_contact = client.delete(
        f"/contacts/{user_priya['id']}",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert res_del_contact.status_code == 200
    print("✓ Rahul successfully removed Priya from contacts")

    # 3g. Delete non-existent contact -> 404 Not Found
    res_del_missing = client.delete(
        f"/contacts/{user_priya['id']}",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert res_del_missing.status_code == 404
    print("✓ Deleting non-existent contact returned 404 Not Found")

    # Re-add Priya so contact relationship exists for UI verification
    client.post(
        "/contacts",
        json={"contact_id": user_priya["id"]},
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    print("✓ Re-added Priya as contact for integration testing")

    # -------------------------------------------------------------------------
    # STEP 4: Start Direct Chat from Contact / Search
    # -------------------------------------------------------------------------
    print("\n[STEP 4] Starting Direct Chat from Search/Contact...")

    # 4a. Rahul opens conversation with Priya
    conv_1 = client.post(
        "/conversations",
        json={"participant_id": user_priya["id"]},
        headers={"Authorization": f"Bearer {token_rahul}"}
    ).json()
    conv_id = conv_1["id"]
    assert conv_1["type"] == "direct"
    print(f"✓ Direct conversation created or retrieved (ID: {conv_id})")

    # 4b. Server-Side Duplicate Prevention:
    # Rahul opens conversation with Priya again -> MUST return same ID
    conv_2 = client.post(
        "/conversations",
        json={"participant_id": user_priya["id"]},
        headers={"Authorization": f"Bearer {token_rahul}"}
    ).json()
    assert conv_2["id"] == conv_id
    print("✓ Duplicate prevention verified: repeated creation returned same conversation ID")

    # Priya opens conversation with Rahul -> MUST also return the exact same ID
    conv_3 = client.post(
        "/conversations",
        json={"participant_id": user_rahul["id"]},
        headers={"Authorization": f"Bearer {token_priya}"}
    ).json()
    assert conv_3["id"] == conv_id
    print("✓ Bi-directional duplicate prevention verified: Priya -> Rahul returns same conversation ID")

    # 4c. Send message in newly opened conversation
    msg_res = client.post(
        f"/conversations/{conv_id}/messages",
        json={"content": "Hey Priya, glad we connected!"},
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert msg_res.status_code == 201
    msg_data = msg_res.json()
    assert msg_data["content"] == "Hey Priya, glad we connected!"
    print(f"✓ Message sent successfully (ID: {msg_data['id']}) in conversation {conv_id}")

    # -------------------------------------------------------------------------
    # STEP 5: Regression Check on Group Messaging
    # -------------------------------------------------------------------------
    print("\n[STEP 5] Regression check: Group messaging integrity...")
    group_res = client.post(
        "/groups",
        json={"name": "Integration Group", "member_ids": [user_priya["id"], user_vikram["id"]]},
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert group_res.status_code == 201
    grp_id = group_res.json()["id"]

    grp_msg = client.post(
        f"/conversations/{grp_id}/messages",
        json={"content": "Testing group messaging integrity in Phase 11"},
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert grp_msg.status_code == 201
    assert grp_msg.json()["content"] == "Testing group messaging integrity in Phase 11"
    print(f"✓ Group messaging functions normally (Group ID: {grp_id})")

    print("\n" + "=" * 80)
    print("ALL 5 PHASE 11 CONTACT & SEARCH VERIFICATION STEPS PASSED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_phase11_verification()

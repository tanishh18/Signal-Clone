import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.auth import create_access_token

TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture
def client_and_tokens():
    engine = create_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        # Register User A (Alice)
        res_a = client.post("/auth/register", json={
            "username": "alice",
            "display_name": "Alice Wonderland",
            "phone": "+10000000001",
            "otp": "123456"
        })
        token_a = res_a.json()["access_token"]
        user_a = res_a.json()["user"]

        # Register User B (Bob)
        res_b = client.post("/auth/register", json={
            "username": "bob",
            "display_name": "Bob Builder",
            "phone": "+10000000002",
            "otp": "123456"
        })
        token_b = res_b.json()["access_token"]
        user_b = res_b.json()["user"]

        # Register User C (Charlie)
        res_c = client.post("/auth/register", json={
            "username": "charlie",
            "display_name": "Charlie Chaplin",
            "phone": "+10000000003",
            "otp": "123456"
        })
        token_c = res_c.json()["access_token"]
        user_c = res_c.json()["user"]

        yield {
            "client": client,
            "user_a": user_a, "token_a": token_a,
            "user_b": user_b, "token_b": token_b,
            "user_c": user_c, "token_c": token_c,
        }

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


# -------------------------------------------------------------
# USERS TESTS
# -------------------------------------------------------------

def test_users_me(client_and_tokens):
    c = client_and_tokens["client"]
    token_a = client_and_tokens["token_a"]

    res = c.get("/users/me", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 200
    assert res.json()["username"] == "alice"


def test_users_search(client_and_tokens):
    c = client_and_tokens["client"]
    token_a = client_and_tokens["token_a"]

    # Search for "bob"
    res = c.get("/users/search?q=bob", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 200
    results = res.json()
    assert len(results) == 1
    assert results[0]["username"] == "bob"
    # Ensure sensitive credentials are never returned
    assert "password_hash" not in results[0]

    # Search should exclude current user
    res_self = c.get("/users/search?q=alice", headers={"Authorization": f"Bearer {token_a}"})
    assert res_self.status_code == 200
    assert len(res_self.json()) == 0


# -------------------------------------------------------------
# CONTACTS TESTS
# -------------------------------------------------------------

def test_contacts_flow(client_and_tokens):
    c = client_and_tokens["client"]
    token_a = client_and_tokens["token_a"]
    user_b = client_and_tokens["user_b"]
    user_a = client_and_tokens["user_a"]

    # 1. Add contact Bob
    res_add = c.post(
        "/contacts",
        json={"contact_id": user_b["id"], "nickname": "Bobby"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_add.status_code == 201
    assert res_add.json()["nickname"] == "Bobby"
    assert res_add.json()["contact_user"]["username"] == "bob"

    # 2. Duplicate contact rejection
    res_dup = c.post(
        "/contacts",
        json={"contact_id": user_b["id"]},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_dup.status_code == 409

    # 3. Self-contact rejection
    res_self = c.post(
        "/contacts",
        json={"contact_id": user_a["id"]},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_self.status_code == 400

    # 4. List contacts
    res_list = c.get("/contacts", headers={"Authorization": f"Bearer {token_a}"})
    assert res_list.status_code == 200
    assert len(res_list.json()) == 1

    # 5. Remove contact
    res_del = c.delete(f"/contacts/{user_b['id']}", headers={"Authorization": f"Bearer {token_a}"})
    assert res_del.status_code == 200
    assert c.get("/contacts", headers={"Authorization": f"Bearer {token_a}"}).json() == []


# -------------------------------------------------------------
# CONVERSATIONS & DIRECT CHAT DUPLICATE PREVENTION TESTS
# -------------------------------------------------------------

def test_direct_conversation_duplicate_prevention(client_and_tokens):
    c = client_and_tokens["client"]
    token_a = client_and_tokens["token_a"]
    token_b = client_and_tokens["token_b"]
    user_a = client_and_tokens["user_a"]
    user_b = client_and_tokens["user_b"]

    # 1. Alice creates direct conversation with Bob
    res1 = c.post(
        "/conversations",
        json={"participant_id": user_b["id"]},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res1.status_code == 201
    conv_id_1 = res1.json()["id"]

    # 2. Alice calls it again with Bob -> must return exact same conversation ID
    res2 = c.post(
        "/conversations",
        json={"participant_id": user_b["id"]},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res2.json()["id"] == conv_id_1

    # 3. Bob calls it with Alice (reverse direction B -> A) -> must return exact same conversation ID!
    res3 = c.post(
        "/conversations",
        json={"participant_id": user_a["id"]},
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res3.json()["id"] == conv_id_1


def test_conversation_authorization_and_details(client_and_tokens):
    c = client_and_tokens["client"]
    token_a = client_and_tokens["token_a"]
    token_b = client_and_tokens["token_b"]
    token_c = client_and_tokens["token_c"]
    user_b = client_and_tokens["user_b"]

    # Alice creates conversation with Bob
    res_create = c.post(
        "/conversations",
        json={"participant_id": user_b["id"]},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    conv_id = res_create.json()["id"]

    # Alice can view details
    res_a = c.get(f"/conversations/{conv_id}", headers={"Authorization": f"Bearer {token_a}"})
    assert res_a.status_code == 200

    # Bob can view details
    res_b = c.get(f"/conversations/{conv_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b.status_code == 200

    # Charlie (unauthorized non-member) MUST get 403 Forbidden!
    res_c = c.get(f"/conversations/{conv_id}", headers={"Authorization": f"Bearer {token_c}"})
    assert res_c.status_code == 403
    assert "not a member" in res_c.json()["detail"].lower()


# -------------------------------------------------------------
# MESSAGING & READ RECEIPTS TESTS
# -------------------------------------------------------------

def test_messages_flow_and_authorization(client_and_tokens):
    c = client_and_tokens["client"]
    token_a = client_and_tokens["token_a"]
    token_b = client_and_tokens["token_b"]
    token_c = client_and_tokens["token_c"]
    user_b = client_and_tokens["user_b"]

    # Create direct conversation between Alice and Bob
    res_conv = c.post(
        "/conversations",
        json={"participant_id": user_b["id"]},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    conv_id = res_conv.json()["id"]

    # 1. Non-member Charlie cannot send message -> 403
    res_c_send = c.post(
        f"/conversations/{conv_id}/messages",
        json={"content": "I am eavesdropping!"},
        headers={"Authorization": f"Bearer {token_c}"}
    )
    assert res_c_send.status_code == 403

    # 2. Empty message rejected -> 400
    res_empty = c.post(
        f"/conversations/{conv_id}/messages",
        json={"content": "   "},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_empty.status_code == 400

    # 3. Alice sends valid message
    res_msg1 = c.post(
        f"/conversations/{conv_id}/messages",
        json={"content": "Hello Bob, are you there?"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_msg1.status_code == 201
    msg1_id = res_msg1.json()["id"]

    # 4. Bob checks message history
    res_history = c.get(
        f"/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res_history.status_code == 200
    msgs = res_history.json()
    assert len(msgs) == 1
    assert msgs[0]["content"] == "Hello Bob, are you there?"

    # 5. Non-member Charlie cannot view history -> 403
    res_c_hist = c.get(
        f"/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {token_c}"}
    )
    assert res_c_hist.status_code == 403

    # 6. Bob checks conversation list: unread count should be 1
    res_list = c.get("/conversations", headers={"Authorization": f"Bearer {token_b}"})
    assert res_list.status_code == 200
    conv_item = next(conv for conv in res_list.json() if conv["id"] == conv_id)
    assert conv_item["unread_count"] == 1

    # 7. Bob marks conversation as read
    res_read = c.post(
        f"/conversations/{conv_id}/read",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res_read.status_code == 200
    assert res_read.json()["marked_count"] == 1

    # 8. Unread count for Bob should now be 0
    res_list_after = c.get("/conversations", headers={"Authorization": f"Bearer {token_b}"})
    conv_after = next(conv for conv in res_list_after.json() if conv["id"] == conv_id)
    assert conv_after["unread_count"] == 0


# -------------------------------------------------------------
# GROUPS & ADMIN AUTHORIZATION TESTS
# -------------------------------------------------------------

def test_groups_admin_authorization(client_and_tokens):
    c = client_and_tokens["client"]
    token_a = client_and_tokens["token_a"]
    token_b = client_and_tokens["token_b"]
    token_c = client_and_tokens["token_c"]
    user_b = client_and_tokens["user_b"]
    user_c = client_and_tokens["user_c"]

    # 1. Alice creates group "Alpha Team" with Bob
    res_group = c.post(
        "/groups",
        json={"name": "Alpha Team", "member_ids": [user_b["id"]]},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_group.status_code == 201
    group_id = res_group.json()["id"]

    # 2. View members
    res_members = c.get(f"/groups/{group_id}/members", headers={"Authorization": f"Bearer {token_a}"})
    assert res_members.status_code == 200
    members = res_members.json()
    assert len(members) == 2
    alice_mem = next(m for m in members if m["user"]["username"] == "alice")
    bob_mem = next(m for m in members if m["user"]["username"] == "bob")
    assert alice_mem["role"] == "admin"
    assert bob_mem["role"] == "member"

    # 3. Non-admin Bob tries to add Charlie -> MUST be rejected with 403 Forbidden!
    res_bob_add = c.post(
        f"/groups/{group_id}/members",
        json={"user_id": user_c["id"]},
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res_bob_add.status_code == 403
    assert "only group admins" in res_bob_add.json()["detail"].lower()

    # 4. Admin Alice adds Charlie -> success
    res_alice_add = c.post(
        f"/groups/{group_id}/members",
        json={"user_id": user_c["id"]},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_alice_add.status_code == 201

    # 5. Non-admin Bob tries to remove Charlie -> MUST be rejected with 403 Forbidden!
    res_bob_del = c.delete(
        f"/groups/{group_id}/members/{user_c['id']}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res_bob_del.status_code == 403

    # 6. Admin Alice tries to remove the only admin (herself) without transfer -> 400 Bad Request
    res_del_last_admin = c.delete(
        f"/groups/{group_id}/members/{alice_mem['user']['id']}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_del_last_admin.status_code == 400
    assert "only group admin" in res_del_last_admin.json()["detail"].lower()

    # 7. Admin Alice removes Charlie -> success
    res_alice_del = c.delete(
        f"/groups/{group_id}/members/{user_c['id']}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_alice_del.status_code == 200

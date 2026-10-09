# Signal Clone — Secure Messaging Web Application

A full-stack Signal-inspired messaging platform built as a hiring assignment. The application replicates Signal Desktop's core UI/UX, real-time messaging, group chats, delivery/read receipts, and typing indicators.

> **Assignment Disclosure:** Authentication uses mocked OTP verification and cryptographic key exchange is simulated. This is not a production security implementation.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Python, FastAPI, Uvicorn |
| Database | SQLite (via SQLAlchemy async) |
| Real-time | Native WebSockets (FastAPI) |
| Auth | Mocked OTP → JWT tokens |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Next.js Frontend               │
│  (React 19 · Tailwind v4 · TypeScript)          │
│                                                 │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Sidebar  │  │  Chat    │  │   Modals     │  │
│  │  Panel    │  │  Window  │  │  (Settings,  │  │
│  │           │  │          │  │   Groups,    │  │
│  │           │  │          │  │   Contacts)  │  │
│  └───────────┘  └──────────┘  └──────────────┘  │
│         │              │              │          │
│         └──────────────┼──────────────┘          │
│                        │                         │
│              REST API  │  WebSocket              │
└────────────────────────┼─────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────┐
│               FastAPI Backend                    │
│                                                  │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Auth    │  │  REST API  │  │  WebSocket   │  │
│  │  (OTP/  │  │  Routes    │  │  Manager     │  │
│  │   JWT)   │  │            │  │              │  │
│  └──────────┘  └────────────┘  └──────────────┘  │
│                        │                         │
│              ┌─────────┴─────────┐               │
│              │   SQLite (async)  │               │
│              │   via SQLAlchemy  │               │
│              └───────────────────┘               │
└──────────────────────────────────────────────────┘
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | User accounts (username, display_name, phone, avatar, online status) |
| `conversations` | Chat containers (direct or group, name, avatar) |
| `conversation_members` | Many-to-many membership with role (admin/member) |
| `messages` | Message content, sender, status (sending/sent/delivered/read), timestamps |
| `message_reads` | Per-user read receipts |
| `contacts` | User-to-user contact list |

---

## API Overview

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/request-otp` | Request mock OTP for a user |
| POST | `/auth/verify-otp` | Verify OTP and receive JWT |
| POST | `/auth/register` | Register new user |
| GET | `/auth/me` | Get current authenticated user |
| GET | `/users/search` | Search users by name/username/phone |
| GET | `/contacts/` | List user's contacts |
| POST | `/contacts/` | Add a contact |
| DELETE | `/contacts/{id}` | Remove a contact |
| GET | `/conversations/` | List user's conversations |
| POST | `/conversations/direct` | Create or get 1:1 conversation |
| GET | `/conversations/{id}` | Get conversation details |
| GET | `/conversations/{id}/messages` | Get message history |
| POST | `/conversations/{id}/messages` | Send a message |
| PUT | `/conversations/{id}/read` | Mark conversation as read |
| POST | `/groups/` | Create a group |
| POST | `/groups/{id}/members` | Add group member |
| DELETE | `/groups/{id}/members/{uid}` | Remove group member |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `message.created` | Server → Client | New message in a conversation |
| `message.delivered` | Client → Server | Delivery acknowledgment |
| `message.read` | Bidirectional | Read receipt |
| `typing.start` | Bidirectional | User started typing |
| `typing.stop` | Bidirectional | User stopped typing |
| `presence.update` | Server → Client | Online/offline status change |

---

## Authentication

Authentication uses a **mocked OTP flow** designed for easy evaluation:

1. Client requests OTP for a username or phone number
2. Backend returns the OTP directly in the response (no SMS/email)
3. Client verifies OTP to receive a JWT access token
4. JWT is stored in localStorage and sent as `Authorization: Bearer <token>`

> **Note:** This is intentionally simplified. In production, OTP would be sent via SMS/email, and tokens would use secure HTTP-only cookies.

---

## Encryption

**Encryption is simulated/mocked** per the assignment guidelines. The UI displays privacy messaging to match Signal's UX, but no actual end-to-end encryption (Signal Protocol, Double Ratchet, etc.) is implemented. Messages are transmitted and stored as plaintext.

---

## Seeded Demo Data

The database ships pre-seeded with:

- **3 users:** Rahul, Ananya, Vikram (with realistic Indian names and phone numbers)
- **Direct conversations** between all user pairs with realistic message history
- **1 group conversation** ("College Friends") with all three members
- **Contacts** pre-configured between users
- **Unread messages** and delivery states for testing

Quick login buttons on the login screen allow instant access to any demo profile.

---

## Setup Instructions

### Prerequisites

- Node.js ≥ 20
- Python ≥ 3.11

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Run the server (seeds database automatically on first start)
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend runs at: `http://127.0.0.1:8000`
API docs at: `http://127.0.0.1:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

### Running Tests

```bash
cd backend
source .venv/bin/activate
python -m pytest tests/ -v
```

---

## Placeholder Features

The following features are represented in the UI as "Coming Soon" placeholders:

- **Voice/Video Calls** — Buttons present in chat header, show placeholder toast
- **File Attachments** — Paperclip icon in composer, shows placeholder toast
- **Linked Devices** — Listed in Privacy settings as coming soon
- **Stories** — Not implemented
- **Disappearing Messages** — Not implemented

---

## Known Limitations

- SQLite is used for simplicity; not suitable for production-scale concurrent access
- WebSocket connections are in-memory; server restart disconnects all clients
- JWT tokens are stored in localStorage (not HTTP-only cookies)
- No rate limiting on API endpoints
- No file/image upload support
- No message editing or deletion
- No end-to-end encryption (simulated only)
- Single-server deployment (no horizontal scaling)

---

## Project Structure

```
Signal Clone/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry
│   │   ├── config.py            # Configuration
│   │   ├── database.py          # SQLAlchemy async setup
│   │   ├── models.py            # Database models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT/auth utilities
│   │   ├── routers/             # REST API routes
│   │   ├── services/            # Business logic
│   │   └── websocket/           # WebSocket manager & router
│   ├── tests/                   # Pytest test suite
│   ├── seed.py                  # Database seeding
│   └── requirements.txt
├── frontend/
│   ├── app/                     # Next.js App Router
│   ├── components/              # React components
│   │   ├── auth/                # Login/register
│   │   ├── chat/                # Chat window, header, composer
│   │   ├── messages/            # Message bubbles, typing indicator
│   │   ├── sidebar/             # Conversation list
│   │   ├── groups/              # Group modals
│   │   ├── settings/            # Settings modal
│   │   └── ui/                  # Shared UI (Avatar)
│   ├── context/                 # Auth context
│   ├── lib/                     # API client, WebSocket client
│   ├── types/                   # TypeScript interfaces
│   └── postcss.config.mjs       # Tailwind v4 PostCSS config
└── README.md
```

---

## How to Evaluate

1. Start the backend server
2. Start the frontend dev server
3. Open `http://localhost:3000`
4. Click any **Fast Evaluation Profile** (Rahul, Ananya, Vikram) to log in instantly
5. Open a second browser/incognito window and log in as a different user
6. Send messages between the two users — observe real-time delivery
7. Watch for delivery checkmarks (✓ sent, ✓✓ delivered, blue ✓✓ read)
8. Test typing indicators
9. Create a group, add members, send group messages
10. Use the contacts/search feature to find and add users
11. Toggle dark mode in Settings
12. Test responsive behavior at different viewport widths

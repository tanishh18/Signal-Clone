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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/api/health` | Health check alias |
| POST | `/auth/request-otp` | Request mock OTP (returns `123456`) |
| POST | `/auth/register` | Register new user with username, display name, and OTP |
| POST | `/auth/login` | Log in with username/phone and OTP, receive JWT token |
| POST | `/auth/logout` | Log out and update user offline presence |
| GET | `/auth/me` | Get current authenticated user profile |
| GET | `/users/search` | Search users by query string (excludes caller) |
| GET | `/contacts` | List authenticated user's saved contacts |
| POST | `/contacts` | Add a new contact by user ID |
| DELETE | `/contacts/{id}` | Remove a contact |
| GET | `/conversations` | List user's conversations sorted by activity |
| POST | `/conversations` | Create or retrieve direct 1:1 conversation (duplicate-safe) |
| GET | `/conversations/{id}` | Get conversation details (membership checked) |
| GET | `/conversations/{id}/messages` | Get chronological message history |
| POST | `/conversations/{id}/messages` | Send a new message to conversation |
| POST | `/conversations/{id}/read` | Mark unread messages in conversation as read |
| POST | `/groups` | Create group conversation (creator automatically admin) |
| GET | `/groups/{id}/members` | View group members and roles |
| POST | `/groups/{id}/members` | Add member to group (admin only) |
| DELETE | `/groups/{id}/members/{uid}` | Remove member (admin) or leave group (self) |

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

## Deployment Instructions

### Architecture
- **Frontend:** Hosted on **Vercel** (or Netlify / Render Static).
- **Backend:** Hosted on **Render** (or Railway / Fly.io / VPS) as a single persistent service instance with WebSocket support.

### Backend Deployment (e.g. Render / Railway / VPS)
- **Build Command:** `pip install -r requirements.txt && python seed.py`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
- **Required Environment Variables:**
  - `PORT`: Provided automatically by host (default `8000`)
  - `CORS_ORIGINS`: Your frontend URL (e.g., `https://your-signal-clone.vercel.app`)
  - `JWT_SECRET`: A secure random string for JWT token signing
  - `DATABASE_URL`: `sqlite:///./signal.db` (or a mounted persistent disk path `sqlite:////var/data/signal.db`)

### Frontend Deployment (e.g. Vercel)
- **Root Directory:** `frontend`
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Install Command:** `npm install`
- **Required Environment Variables:**
  - `NEXT_PUBLIC_API_URL`: Your deployed backend URL (e.g. `https://your-signal-backend.onrender.com`)
  - `NEXT_PUBLIC_WS_URL`: Your deployed WebSocket URL (e.g. `wss://your-signal-backend.onrender.com/ws`)

---

## Desktop Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | Open New Chat / Compose Search modal |
| `Cmd/Ctrl + F` | Focus Sidebar Search field |
| `Escape` | Close any active modal, search bar, popover, or details view |
| `Enter` | Send message in Message Composer |
| `Shift + Enter` | Insert newline in Message Composer |

---

## Implemented & Simulated Features

- **Three-Tier Shell**: Fixed 60px Navigation Rail (Chats, Calls, Stories, Settings) + 320px Contextual Sidebar + Main Canvas
- **Message Reactions & Emojis**: Quick horizontal reaction picker (❤️, 👍, 👎, 😂, 😮, 😢, 🙏, 🔥), reaction badges, and expandable 32-emoji picker
- **In-Chat Message Search**: Search messages in conversation, active query match count, next/previous match buttons, keyword mark highlighting
- **Pinned Messages**: Pin/unpin messages via hover/context menu with top pinned message banner
- **Call Simulation**: Encrypted voice & video call modal with calling state, call timer, mic/camera toggles, and end call button
- **Sidebar Filtering**: Filter conversation list by All, Unread, or Groups
- **Draft Persistence**: Unsent message drafts preserved per conversation and persisted across page reloads
- **Settings Persistence**: Dark/light theme selection and privacy toggles (read receipts, typing indicators, disappearing timer) saved in localStorage

---

## Placeholder Features

The following extended features are represented in the UI as polite Signal-style indicators:

- **Stories / Linked Devices** — Nav rail tab with coming soon toast
- **File Attachments** — Attachment popover with photos, files, and polls
- **Voice Note Recording** — Mic button shows voice messages coming soon
- **Real WebRTC / E2EE** — Handled via client-side simulation and simulated encryption notices

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

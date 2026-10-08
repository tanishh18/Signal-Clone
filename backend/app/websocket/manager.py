import asyncio
import json
import logging
from typing import Dict, Set, List, Optional
from fastapi import WebSocket

logger = logging.getLogger("websocket")


class ConnectionManager:
    """
    Centralized in-process WebSocket connection manager.
    Tracks active connections per authenticated user and supports multiple
    concurrent tabs/devices per user.
    """

    def __init__(self):
        # Maps user_id -> set of active WebSocket instances
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: int, websocket: WebSocket) -> bool:
        """
        Registers a new WebSocket connection for an authenticated user.
        Returns True if this is the user's first active connection (presence online).
        """
        await websocket.accept()
        async with self._lock:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()
            
            is_first_connection = len(self.active_connections[user_id]) == 0
            self.active_connections[user_id].add(websocket)
            return is_first_connection

    async def disconnect(self, user_id: int, websocket: WebSocket) -> bool:
        """
        Removes a WebSocket connection for a user.
        Returns True if this was the user's final connection (presence offline).
        """
        async with self._lock:
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                if len(self.active_connections[user_id]) == 0:
                    del self.active_connections[user_id]
                    return True
            return False

    def is_user_online(self, user_id: int) -> bool:
        """Checks if a user has at least one active connection."""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    def get_online_user_ids(self) -> Set[int]:
        """Returns set of all currently connected user IDs."""
        return set(self.active_connections.keys())

    async def send_to_user(self, user_id: int, event: dict):
        """
        Sends a structured JSON event to all active connections for a given user.
        Catches and cleans up any dead sockets gracefully.
        """
        sockets = list(self.active_connections.get(user_id, set()))
        stale_sockets = []

        for ws in sockets:
            try:
                await ws.send_text(json.dumps(event))
            except Exception as e:
                logger.warning(f"Failed sending to user {user_id}: {e}")
                stale_sockets.append(ws)

        if stale_sockets:
            async with self._lock:
                if user_id in self.active_connections:
                    for s in stale_sockets:
                        self.active_connections[user_id].discard(s)
                    if len(self.active_connections[user_id]) == 0:
                        del self.active_connections[user_id]

    async def broadcast_to_conversation(
        self,
        member_user_ids: List[int],
        event: dict,
        exclude_user_id: Optional[int] = None
    ):
        """
        Broadcasts an event to all connected members of a conversation.
        Optionally excludes a specific user (e.g., sender for typing events).
        """
        for uid in member_user_ids:
            if exclude_user_id is not None and uid == exclude_user_id:
                continue
            if self.is_user_online(uid):
                await self.send_to_user(uid, event)


manager = ConnectionManager()

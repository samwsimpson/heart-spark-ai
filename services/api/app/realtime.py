from __future__ import annotations
from collections import defaultdict
from typing import Dict, Set
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: Dict[str, Set[WebSocket]] = defaultdict(set)

    async def connect(self, room: str, ws: WebSocket) -> None:
        await ws.accept()
        self.rooms[room].add(ws)

    def disconnect(self, room: str, ws: WebSocket) -> None:
        self.rooms[room].discard(ws)
        if not self.rooms[room]:
            self.rooms.pop(room, None)

    async def broadcast_json(self, room: str, payload: dict) -> None:
        # Copy to avoid 'Set changed size during iteration'
        for ws in list(self.rooms.get(room, ())):
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(room, ws)

manager = ConnectionManager()

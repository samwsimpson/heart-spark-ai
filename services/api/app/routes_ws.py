from __future__ import annotations
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from anyio import to_thread
from app.realtime import manager
from app.security import decode_token
from app.moderation import is_allowed

# Optional persistence (works if your Message model exists)
def _save_message_sync(sender_id: int, room: str, content: str):
    try:
        from app.db import SessionLocal
        from app.models import Message
        db = SessionLocal()
        try:
            msg = Message(sender_id=sender_id, room=room, content=content)  # requires these columns
            db.add(msg)
            db.commit()
        finally:
            db.close()
    except Exception:
        # Non-fatal in scaffold mode
        pass

router = APIRouter()

@router.websocket("/ws/chat")
async def ws_chat(
    websocket: WebSocket,
    token: str = Query(default=""),
    room: str = Query(default="lobby"),
):
    # Authenticate from JWT in ?token=
    try:
        data = decode_token(token)
        user_id = int(data.get("sub", 0))
        username = data.get("username", f"user-{user_id}")
        assert user_id > 0
    except Exception:
        # 4401: unauthorized (WebSocket close code)
        await websocket.close(code=4401)
        return

    await manager.connect(room, websocket)
    await manager.broadcast_json(room, {"type": "join", "user": username})

    try:
        while True:
            payload = await websocket.receive_json()  # expect {"text": "..."}
            text = (payload or {}).get("text", "")
            if not is_allowed(text):
                await websocket.send_json({"type": "error", "reason": "blocked"})
                continue

            await manager.broadcast_json(room, {"type": "message", "user": username, "text": text})

            # Persist (best-effort)
            await to_thread.run_sync(_save_message_sync, user_id, room, text)
    except WebSocketDisconnect:
        await manager.broadcast_json(room, {"type": "leave", "user": username})
        manager.disconnect(room, websocket)

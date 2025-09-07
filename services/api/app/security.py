from __future__ import annotations
import os, time, typing as t
import jwt
from passlib.context import CryptContext

JWT_SECRET = os.environ.get("JWT_SECRET") or "dev-insecure"
JWT_ALGO = "HS256"
ACCESS_TTL_SECS = 60 * 60 * 24 * 7  # 7 days

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return pwd.verify(password, password_hash)

def create_access_token(sub: t.Union[int, str], extra: dict | None = None, ttl: int = ACCESS_TTL_SECS) -> str:
    now = int(time.time())
    payload = {"sub": str(sub), "iat": now, "exp": now + ttl}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])

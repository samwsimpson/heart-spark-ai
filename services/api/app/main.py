from __future__ import annotations

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes_auth import router as auth_router
from app.routes_ws import router as ws_router

app = FastAPI(title="Dating API")

# CORS
origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic health + sample
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/greet")
def greet(name: str = "World"):
    return {"message": f"Hello, {name}!"}

# --- Debug: list routes (no auth) ---
@app.get("/__routes")
def __routes():
    out = []
    for r in app.router.routes:
        try:
            path = r.path
        except Exception:
            path = getattr(r, "path_format", str(r))
        methods = sorted(list(getattr(r, "methods", []) or []))
        out.append({"path": path, "methods": methods})
    return out

# Routers
app.include_router(auth_router)
app.include_router(ws_router)

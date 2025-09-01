from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENV: str = "local"
    ALLOWED_ORIGINS: str = "http://localhost:3000"

settings = Settings()
app = FastAPI(title="Dating API", version="0.1.0")

origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allow_headers=["Authorization","Content-Type","X-Requested-With"],
)

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/greet")
def greet(name: str = "World"):
    return {"message": f"Hello, {name}!"}

@app.options("/{path:path}")
def options_handler():
    return {}

@app.get("/health")
def health():
    return {"status": "ok"}

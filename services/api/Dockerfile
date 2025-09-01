FROM python:3.11-slim

# System deps (build essentials for any binary wheels you might add later)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Poetry globally (no virtualenv inside container to keep it simple)
ENV POETRY_VERSION=1.8.3 \
    POETRY_VIRTUALENVS_CREATE=false \
    PIP_NO_CACHE_DIR=1
RUN pip install "poetry==$POETRY_VERSION"

# Pre-copy lockfiles to leverage Docker layer caching
COPY pyproject.toml poetry.lock* /app/

# Install runtime dependencies only (no dev)
RUN poetry install --no-root --only main

# Bring in the app code
COPY app /app/app

EXPOSE 8080
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8080"]

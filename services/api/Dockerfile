# services/api/Dockerfile
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1 \
    PORT=8080

# System deps often needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
  && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir poetry

# Copy only dependency files first (layer cache)
COPY services/api/pyproject.toml services/api/poetry.lock ./

# Install runtime deps
RUN poetry install --only main

# Copy application code
COPY services/api/app ./app

# Expose and run
EXPOSE 8080
CMD ["sh","-c","uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]

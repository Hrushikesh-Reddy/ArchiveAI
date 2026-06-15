# --- Stage 1: Build Stage ---
FROM python:3.12-slim-bookworm AS builder

# Install uv directly
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /rp1_backend

# Copy only dependency files first to leverage Docker layer caching
COPY pyproject.toml uv.lock* ./

# 1. Create the virtual environment explicitly
RUN uv venv

RUN uv pip install torch --index-url https://download.pytorch.org/whl/cpu

# 2. Sync dependencies while forcing uv to look at the CPU-only repository
# This ensures sentence-transformers grabs the CPU version of torch during resolution
RUN uv sync --no-cache --no-dev --no-install-project

# --- Stage 2: Final Runtime Stage ---
FROM python:3.12-slim-bookworm AS runner

# Install java
RUN apt-get update && \
    apt-get install -y --no-install-recommends default-jre && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /rp1_backend

# Copy the entire virtual environment from the builder stage
COPY --from=builder /rp1_backend/.venv /rp1_backend/.venv

# Copy your actual application code
COPY . .

# Environment variables
ENV PATH="/rp1_backend/.venv/bin:$PATH"
# Ensure Next.js/outside world can talk to FastAPI inside the container
ENV HOSTNAME="0.0.0.0" 

EXPOSE 8000

CMD ["fastapi", "run", "main.py", "--host", "0.0.0.0", "--port", "8000"]
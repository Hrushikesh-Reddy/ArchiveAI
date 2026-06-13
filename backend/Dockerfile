FROM python:3.12-slim-bookworm

WORKDIR /rp1_backend

COPY ./pyproject.toml /rp1_backend/pyproject.toml

RUN pip install uv --no-cache-dir

RUN uv sync --no-cache

COPY ./ /rp1_backend

ENV PATH="/rp1_backend/.venv/bin:$PATH"

CMD ["fastapi", "run", "main.py"]
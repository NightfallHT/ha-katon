FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Built from the repo root (render.yaml: dockerContext: .), so paths start with ai/.
COPY ai/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ai/ .

# catalog.py reads REPO_ROOT/data/seed, and util.py puts REPO_ROOT one level above
# this WORKDIR — so /data/seed. Without it the service silently serves the ten
# entries in ai/fixtures instead of the 116 real innovations, and /web has no page
# for any of them: every search result then links nowhere.
COPY data/seed/ /data/seed/

EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

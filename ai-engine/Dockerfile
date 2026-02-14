FROM python:3.12-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Create data dirs
RUN mkdir -p data/chromadb data/uploads

EXPOSE 7860

# HF Spaces expects port 7860; PORT env var overrides for other platforms
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}

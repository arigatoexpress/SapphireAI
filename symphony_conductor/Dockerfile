FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy shared library
COPY symphony_lib /app/symphony_lib

# Copy conductor code
COPY symphony_conductor /app/symphony_conductor

# Install dependencies
RUN pip install --no-cache-dir \
    google-cloud-pubsub \
    google-generativeai \
    asyncio \
    aiohttp

# Set Python path to include root for shared lib import
ENV PYTHONPATH=/app

# Run the conductor
CMD ["python", "symphony_conductor/main.py"]

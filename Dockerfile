# Multi-stage build for optimized image size
# Stage 1: Build dependencies
FROM python:3.11-slim as builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
        g++ \
        && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better layer caching
COPY requirements.txt .
# Install Python packages with parallel pip for faster builds
RUN pip install --user --no-cache-dir --use-pep517 -r requirements.txt

# Stage 2: Runtime image
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH=/home/trader/.local/bin:$PATH

# Install runtime dependencies only
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r trader && useradd -r -g trader trader

# Set working directory
WORKDIR /app

# Copy Python packages from builder stage
COPY --from=builder --chown=trader:trader /root/.local /home/trader/.local

# Copy application code with forced cache invalidation
ARG CACHE_BUST
RUN echo "Cache bust: $CACHE_BUST"
COPY --chown=trader:trader cloud_trader ./cloud_trader
COPY --chown=trader:trader start.py ./
COPY --chown=trader:trader pyproject.toml ./

# Set environment and permissions
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1

# Switch to non-root user
USER trader

EXPOSE 8080

# Health check with fast timeout for HFT readiness
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:8080/healthz || exit 1

# Startup script to ensure proper initialization
CMD ["python3", "start.py"]

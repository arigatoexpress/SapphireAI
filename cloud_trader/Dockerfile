# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory - put source in a package directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create cloud_trader package directory and copy code
RUN mkdir -p /app/cloud_trader
COPY . /app/cloud_trader/

# Set Python path to recognize the package
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run the application using the module path
CMD ["python", "-m", "uvicorn", "cloud_trader.api:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]

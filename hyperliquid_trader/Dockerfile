FROM python:3.10-slim

WORKDIR /app

COPY hyperliquid_trader/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY hyperliquid_trader/ .
COPY symphony_lib /app/symphony_lib

CMD ["python", "-u", "service.py"]

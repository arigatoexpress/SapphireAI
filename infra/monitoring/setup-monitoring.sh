#!/bin/bash

set -e

echo "🚀 Setting up Trading System Monitoring Stack..."

# Create necessary directories
mkdir -p monitoring/{prometheus,grafana}

# Start monitoring stack
echo "📊 Starting Prometheus, Grafana, and exporters..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
curl -s http://localhost:9090/-/ready || echo "❌ Prometheus not ready"
curl -s http://localhost:3000/api/health || echo "❌ Grafana not ready"

echo "✅ Monitoring stack started!"
echo ""
echo "📈 Access Points:"
echo "  - Grafana: http://localhost:3000 (admin/admin)"
echo "  - Prometheus: http://localhost:9090"
echo "  - Trading Dashboard: http://localhost:3000/d/trading-dashboard"
echo ""
echo "🔧 Configuration files:"
echo "  - Prometheus: ./prometheus.yml"
echo "  - Grafana: ./grafana-provisioning.yml"
echo "  - Dashboard: ./trading-dashboard.json"

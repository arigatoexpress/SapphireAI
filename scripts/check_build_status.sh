#!/bin/bash
# Quick check of build status
BUILD_ID=${1:-c096b53f-f486-4264-89de-0fb652bc0e68}

echo "Build Status:"
gcloud builds describe "$BUILD_ID" --format="table(status,createTime,startTime,finishTime)" 2>&1

echo ""
echo "Current Step:"
gcloud builds log "$BUILD_ID" 2>&1 | tail -5

echo ""
echo "Full logs: https://console.cloud.google.com/cloud-build/builds/$BUILD_ID?project=342943608894"


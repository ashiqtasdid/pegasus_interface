#!/bin/bash

echo "Testing Pegasus Interface Endpoints..."
echo "======================================"

BASE_URL="http://localhost:3001"

echo -e "\n1. Testing Health Endpoint:"
curl -s "${BASE_URL}/api/health" | jq '.'

echo -e "\n2. Testing Plugin Discovery (should work without auth):"
curl -s "${BASE_URL}/api/plugins/discovery?limit=3" | jq '.'

echo -e "\n3. Testing Auth Status:"
curl -s "${BASE_URL}/api/auth/get-session" | jq '.'

echo -e "\n4. Testing Plugins Endpoint (should require auth):"
curl -s "${BASE_URL}/api/plugins" | jq '.'

echo -e "\n5. Testing Admin Users Endpoint (should require admin auth):"
curl -s "${BASE_URL}/api/admin/users" | jq '.'

echo -e "\nTest completed!"
echo "======================================"

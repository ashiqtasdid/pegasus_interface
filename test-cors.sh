#!/bin/bash

# CORS Implementation Test Script
# Tests CORS headers across all updated API endpoints

echo "🔍 Testing CORS Implementation Across API Endpoints"
echo "=================================================="

BASE_URL="http://localhost:3001"
ENDPOINTS=(
    "/api/health"
    "/api/health/detailed"
    "/api/generate"
    "/api/chat"
    "/api/chat/send"
    "/api/plugins"
    "/api/admin/users"
    "/api/admin/users/role"
    "/api/admin/users/plugin-limit"
    "/api/admin/users/status"
    "/api/user/preferences"
)

SUCCESS_COUNT=0
TOTAL_COUNT=0

echo ""
echo "Testing OPTIONS (Preflight) Requests:"
echo "====================================="

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "Testing OPTIONS $endpoint... "
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BASE_URL$endpoint")
    
    if [ "$response" = "200" ]; then
        echo "✅ PASS ($response)"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "❌ FAIL ($response)"
    fi
done

echo ""
echo "Testing CORS Headers in Responses:"
echo "=================================="

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "Testing CORS headers for $endpoint... "
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    
    headers=$(curl -s -I "$BASE_URL$endpoint" | grep -i "access-control")
    
    if echo "$headers" | grep -q "access-control-allow-origin"; then
        echo "✅ CORS headers present"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "❌ CORS headers missing"
    fi
done

echo ""
echo "Testing Cross-Origin Request Simulation:"
echo "======================================="

# Test with Origin header to simulate cross-origin request
echo -n "Testing cross-origin request simulation... "
TOTAL_COUNT=$((TOTAL_COUNT + 1))

response=$(curl -s -H "Origin: http://localhost:3000" -w "%{http_code}" "$BASE_URL/api/health")

if echo "$response" | grep -q "200"; then
    echo "✅ Cross-origin request accepted"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "❌ Cross-origin request failed"
fi

echo ""
echo "CORS Implementation Test Results:"
echo "================================"
echo "✅ Passed: $SUCCESS_COUNT/$TOTAL_COUNT tests"

if [ $SUCCESS_COUNT -eq $TOTAL_COUNT ]; then
    echo "🎉 All CORS tests passed! Implementation successful."
    exit 0
else
    echo "⚠️  Some CORS tests failed. Review implementation."
    exit 1
fi

#!/bin/bash

# Script to verify that all protected routes are working correctly
# This script will check if the client-side authentication is properly set up

echo "============================================="
echo "Verifying client-side authentication protection"
echo "============================================="

# Define color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# List of protected routes to check
PROTECTED_ROUTES=(
  "/chat"
  "/create"
  "/plugins"
  "/profile"
  "/debug"
  "/test"
)

# Function to check if withAuth HOC is implemented in a file
check_with_auth() {
  local file=$1
  local route=$2
  
  if grep -q "withAuth" "$file"; then
    echo -e "${GREEN}✓${NC} Route $route is protected with withAuth HOC"
    return 0
  else
    echo -e "${RED}✗${NC} Route $route is NOT protected with withAuth HOC"
    return 1
  fi
}

# Check each protected route
PASS_COUNT=0
FAIL_COUNT=0

for route in "${PROTECTED_ROUTES[@]}"; do
  echo -e "\nChecking $route..."
  route_file="src/app${route}/page.tsx"
  
  if [ -f "$route_file" ]; then
    if check_with_auth "$route_file" "$route"; then
      ((PASS_COUNT++))
    else
      ((FAIL_COUNT++))
      echo -e "${YELLOW}!${NC} To fix: Add 'import withAuth from '@/components/withAuth';"
      echo -e "${YELLOW}!${NC} And wrap the component with 'export default withAuth(YourComponent)';"
    fi
  else
    echo -e "${RED}✗${NC} Route file not found: $route_file"
    ((FAIL_COUNT++))
  fi
done

echo -e "\n============================================="
echo -e "Results: ${GREEN}$PASS_COUNT${NC} protected, ${RED}$FAIL_COUNT${NC} unprotected"
echo "============================================="

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}All routes are properly protected with client-side authentication!${NC}"
  echo "Your application now requires login for all protected features."
else
  echo -e "${RED}Some routes are not properly protected.${NC}"
  echo "Please check the routes marked with ✗ and add authentication protection."
fi

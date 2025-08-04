#!/bin/bash

# Test script to verify nginx routing for Pathfinders
# Run this after deployment to ensure all endpoints are working

set -e

echo "🧪 Testing Pathfinders nginx routing configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test function
test_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    echo "Testing: $description"
    echo "URL: $url"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        print_status "✅ $description - Status: $response"
    else
        print_error "❌ $description - Expected: $expected_status, Got: $response"
        return 1
    fi
    echo ""
}

# Test function with response content
test_endpoint_content() {
    local url=$1
    local expected_pattern=$2
    local description=$3
    
    echo "Testing: $description"
    echo "URL: $url"
    
    response=$(curl -s "$url" 2>/dev/null || echo "")
    
    if echo "$response" | grep -q "$expected_pattern"; then
        print_status "✅ $description - Content matches pattern"
    else
        print_error "❌ $description - Content does not match pattern"
        echo "Response: $response"
        return 1
    fi
    echo ""
}

# Check if services are running
print_status "Checking if services are running..."

# Check Django
if curl -s http://127.0.0.1:8000/health/ > /dev/null; then
    print_status "✅ Django is running on port 8000"
else
    print_error "❌ Django is not running on port 8000"
    exit 1
fi

# Check FastAPI
if curl -s http://127.0.0.1:8001/health/ > /dev/null; then
    print_status "✅ FastAPI is running on port 8001"
else
    print_error "❌ FastAPI is not running on port 8001"
    exit 1
fi

# Check Next.js frontend
if curl -s http://127.0.0.1:3000/ > /dev/null; then
    print_status "✅ Next.js frontend is running on port 3000"
else
    print_error "❌ Next.js frontend is not running on port 3000"
    exit 1
fi

# Check nginx
if sudo systemctl is-active --quiet nginx; then
    print_status "✅ Nginx is running"
else
    print_error "❌ Nginx is not running"
    exit 1
fi

echo ""
print_status "Testing nginx routing through domain..."

# Test domain availability
if curl -s -I https://pathfindersgifts.com/ > /dev/null 2>&1; then
    print_status "✅ Domain is accessible"
else
    print_warning "⚠️  Domain not accessible, testing localhost"
    DOMAIN="http://localhost"
else
    DOMAIN="https://pathfindersgifts.com"
fi

echo ""
print_status "Testing Django endpoints..."

# Test Django health check
test_endpoint "$DOMAIN/health/" "200" "Django health check"

# Test Django admin (should redirect to login)
test_endpoint "$DOMAIN/admin/" "302" "Django admin redirect"

# Test Django API endpoints
test_endpoint "$DOMAIN/api/" "200" "Django API root"

# Test Django auth endpoints
test_endpoint "$DOMAIN/api/auth/login/" "405" "Django login endpoint (method not allowed for GET)"

echo ""
print_status "Testing FastAPI endpoints..."

# Test FastAPI health check
test_endpoint "$DOMAIN/fastapi/health" "200" "FastAPI health check"

# Test FastAPI calculate-gifts endpoint (should return 422 for invalid request)
test_endpoint "$DOMAIN/fastapi/calculate-gifts/" "422" "FastAPI calculate-gifts endpoint (validation error expected)"

# Test FastAPI progress endpoints
test_endpoint "$DOMAIN/fastapi/progress/save/" "422" "FastAPI save progress endpoint (validation error expected)"

echo ""
print_status "Testing static files..."

# Test Next.js static files
test_endpoint "$DOMAIN/_next/static/" "200" "Next.js static files"

# Test Django static files
test_endpoint "$DOMAIN/static/admin/" "200" "Django admin static files"

# Test frontend static files
test_endpoint "$DOMAIN/static/" "200" "Frontend static files"

echo ""
print_status "Testing frontend routing..."

# Test frontend routes (should return 200 for Next.js pages)
test_endpoint "$DOMAIN/" "200" "Frontend homepage"

# Test auth routes
test_endpoint "$DOMAIN/auth/login" "200" "Frontend login page"

# Test dashboard routes
test_endpoint "$DOMAIN/dashboard" "200" "Frontend dashboard page"

echo ""
print_status "Testing nginx configuration..."

# Test nginx config syntax
if sudo nginx -t; then
    print_status "✅ Nginx configuration is valid"
else
    print_error "❌ Nginx configuration has syntax errors"
    exit 1
fi

echo ""
print_status "Testing service connectivity..."

# Test direct service connectivity
print_status "Testing Django direct access..."
curl -s http://127.0.0.1:8000/health/ | grep -q "healthy" && print_status "✅ Django health check passed" || print_error "❌ Django health check failed"

print_status "Testing FastAPI direct access..."
curl -s http://127.0.0.1:8001/health/ | grep -q "healthy" && print_status "✅ FastAPI health check passed" || print_error "❌ FastAPI health check failed"

echo ""
print_status "🎉 Nginx routing test completed!"

echo ""
print_status "Summary of routing configuration:"
echo "- Django API: $DOMAIN/api/* → port 8000"
echo "- Django Admin: $DOMAIN/admin/* → port 8000"
echo "- FastAPI: $DOMAIN/fastapi/* → port 8001 (with prefix stripping)"
echo "- Frontend: $DOMAIN/* → port 3000"
echo "- Static files: $DOMAIN/static/* → appropriate directories"
echo "- Health checks: $DOMAIN/health/ (Django) and $DOMAIN/fastapi/health (FastAPI)"

echo ""
print_status "If any tests failed, check:"
echo "1. Service status: sudo supervisorctl status"
echo "2. Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "3. Service logs: sudo tail -f /var/log/pathfinders-*.log"
echo "4. Nginx config: sudo nginx -t" 
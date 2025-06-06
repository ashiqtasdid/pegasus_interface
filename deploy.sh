#!/bin/bash

# Pegasus Interface - Docker Deployment Script
# VPS: 37.114.41.124:3001

set -e

echo "🚀 Starting Pegasus Interface deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check for environment file
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    print_warning "Please create .env.production with the required environment variables."
    exit 1
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Remove old images (optional - uncomment if you want to force rebuild)
# print_status "Removing old Docker images..."
# docker rmi pegasus-interface_pegasus-interface || true

# Build and start the application
print_status "Building and starting the application..."
docker-compose up --build -d

# Wait for the application to start
print_status "Waiting for application to start..."
sleep 30

# Health check
print_status "Performing health check..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    print_status "✅ Health check passed!"
    print_status "🎉 Deployment successful!"
    print_status "📱 Application is running at: http://37.114.41.124:3001"
else
    print_error "❌ Health check failed!"
    print_warning "Check the logs with: docker-compose logs pegasus-interface"
    exit 1
fi

# Show running containers
print_status "Running containers:"
docker-compose ps

print_status "📋 To view logs, run: docker-compose logs -f pegasus-interface"
print_status "🔄 To restart, run: docker-compose restart pegasus-interface"
print_status "🛑 To stop, run: docker-compose down"

echo ""
print_status "🎯 Deployment completed successfully!"
echo "   🌐 Frontend: http://37.114.41.124:3001"
echo "   🔍 Health: http://37.114.41.124:3001/api/health"
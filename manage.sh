#!/bin/bash

# Production startup and monitoring script for Pegasus Interface

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to check service health
check_health() {
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:3001/api/health > /dev/null; then
            return 0
        fi
        print_warning "Health check attempt $attempt/$max_attempts failed"
        sleep 10
        ((attempt++))
    done
    
    return 1
}

# Function to monitor application
monitor_app() {
    print_info "Starting application monitoring..."
    
    while true; do
        if ! check_health; then
            print_error "Application health check failed!"
            print_warning "Attempting to restart container..."
            docker-compose restart pegasus-interface
            sleep 30
        else
            print_status "Application is healthy"
        fi
        
        # Check every 5 minutes
        sleep 300
    done
}

# Function to show application status
show_status() {
    print_info "=== Pegasus Interface Status ==="
    
    # Container status
    print_info "Container Status:"
    docker-compose ps
    
    echo ""
    
    # Resource usage
    print_info "Resource Usage:"
    docker stats pegasus-interface --no-stream
    
    echo ""
    
    # Health check
    print_info "Health Check:"
    if check_health; then
        print_status "✅ Application is healthy"
    else
        print_error "❌ Application health check failed"
    fi
    
    echo ""
    
    # Recent logs
    print_info "Recent Logs (last 20 lines):"
    docker-compose logs --tail=20 pegasus-interface
}

# Function to backup logs
backup_logs() {
    local backup_dir="/var/log/pegasus-interface"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    
    mkdir -p "$backup_dir"
    
    print_info "Backing up logs to $backup_dir/pegasus_$timestamp.log"
    docker-compose logs pegasus-interface > "$backup_dir/pegasus_$timestamp.log"
    
    # Keep only last 7 days of logs
    find "$backup_dir" -name "pegasus_*.log" -mtime +7 -delete
}

# Main script logic
case "${1:-help}" in
    "start")
        print_status "Starting Pegasus Interface..."
        docker-compose up -d
        sleep 10
        if check_health; then
            print_status "✅ Application started successfully"
        else
            print_error "❌ Application failed to start properly"
            exit 1
        fi
        ;;
        
    "stop")
        print_status "Stopping Pegasus Interface..."
        docker-compose down
        print_status "✅ Application stopped"
        ;;
        
    "restart")
        print_status "Restarting Pegasus Interface..."
        docker-compose restart pegasus-interface
        sleep 10
        if check_health; then
            print_status "✅ Application restarted successfully"
        else
            print_error "❌ Application failed to restart properly"
            exit 1
        fi
        ;;
        
    "status")
        show_status
        ;;
        
    "logs")
        print_info "Showing real-time logs (Ctrl+C to exit):"
        docker-compose logs -f pegasus-interface
        ;;
        
    "monitor")
        monitor_app
        ;;
        
    "backup-logs")
        backup_logs
        ;;
        
    "health")
        if check_health; then
            print_status "✅ Application is healthy"
            exit 0
        else
            print_error "❌ Application health check failed"
            exit 1
        fi
        ;;
        
    "help"|*)
        echo "Pegasus Interface Production Management Script"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|monitor|backup-logs|health|help}"
        echo ""
        echo "Commands:"
        echo "  start       - Start the application"
        echo "  stop        - Stop the application"
        echo "  restart     - Restart the application"
        echo "  status      - Show application status and resource usage"
        echo "  logs        - Show real-time logs"
        echo "  monitor     - Start continuous health monitoring"
        echo "  backup-logs - Backup current logs"
        echo "  health      - Check application health"
        echo "  help        - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 start     # Start the application"
        echo "  $0 status    # Check status"
        echo "  $0 monitor   # Start monitoring (runs in foreground)"
        ;;
esac

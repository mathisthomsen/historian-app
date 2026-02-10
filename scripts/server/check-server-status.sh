#!/bin/bash

# Server Status Check Script für Historian App VPS
# Prüft den aktuellen Stand des Servers

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if running on server or locally
if [ -d "/opt/historian-app" ]; then
    SERVER_MODE=true
    HISTORIAN_PATH="/opt/historian-app/production"
else
    SERVER_MODE=false
    HISTORIAN_PATH="."
    print_warning "Running in local mode. Connect to server to check actual status."
fi

print_header "SERVER STATUS CHECK - Historian App"

# 1. System Information
print_header "1. System Information"
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime -p)"
echo "Date: $(date)"
echo ""
echo "Disk Usage:"
df -h | grep -E '^/dev/|Filesystem'
echo ""
echo "Memory Usage:"
free -h
echo ""

# 2. Docker Status
print_header "2. Docker Status"
if command -v docker &> /dev/null; then
    print_success "Docker is installed"
    echo "Docker Version: $(docker --version)"
    echo ""
    
    echo "Docker Containers:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"
    echo ""
    
    echo "Docker Images:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    echo ""
    
    echo "Docker Networks:"
    docker network ls
    echo ""
    
    echo "Docker Volumes:"
    docker volume ls
    echo ""
else
    print_error "Docker is not installed"
fi

# 3. Historian App Status
print_header "3. Historian App Status"

if [ -d "$HISTORIAN_PATH" ]; then
    print_success "Historian App directory exists: $HISTORIAN_PATH"
    
    cd "$HISTORIAN_PATH" || exit 1
    
    echo ""
    echo "Directory structure:"
    ls -la | head -20
    echo ""
    
    if [ -f "docker/docker-compose.production.yml" ]; then
        print_success "docker-compose.production.yml found"
        
        echo ""
        echo "Checking container status:"
        if docker-compose -f docker/docker-compose.production.yml ps 2>/dev/null; then
            echo ""
        else
            print_warning "Could not check docker-compose status (file might be in different location)"
        fi
    else
        print_warning "docker-compose.production.yml not found in expected location"
        echo "Looking for docker-compose files..."
        find . -name "docker-compose*.yml" -type f 2>/dev/null | head -5
    fi
    
    echo ""
    echo "Checking for .env file:"
    if [ -f ".env" ]; then
        print_success ".env file exists"
        echo "Environment variables (sanitized):"
        grep -E '^[A-Z_]+=' .env | sed 's/=.*/=***/' | head -10
    else
        print_warning ".env file not found"
    fi
    
    echo ""
    echo "Checking Nginx configuration:"
    if [ -d "docker/nginx" ]; then
        print_success "Nginx config directory exists"
        ls -la docker/nginx/
        echo ""
        if [ -f "docker/nginx/nginx-ssl.conf" ]; then
            echo "Active Nginx config (nginx-ssl.conf):"
            echo "---"
            head -30 docker/nginx/nginx-ssl.conf
            echo "---"
        fi
    else
        print_warning "Nginx config directory not found"
    fi
    
    echo ""
    echo "Recent file modifications:"
    find . -type f -mtime -30 -not -path '*/\.*' | head -10
    
else
    print_error "Historian App directory not found: $HISTORIAN_PATH"
    echo ""
    echo "Checking /opt directory:"
    if [ -d "/opt" ]; then
        ls -la /opt/ | head -10
    fi
fi

# 4. Container Health Check
print_header "4. Container Health Check"

CONTAINERS=("historian-app" "historian-nginx" "historian-redis" "historian-certbot")

for container in "${CONTAINERS[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not found")
        if [ "$STATUS" = "running" ]; then
            print_success "$container is running"
            
            # Check logs for errors
            ERROR_COUNT=$(docker logs "$container" 2>&1 | grep -i "error\|fatal\|critical" | wc -l)
            if [ "$ERROR_COUNT" -gt 0 ]; then
                print_warning "$container has $ERROR_COUNT potential errors in logs"
            fi
        else
            print_warning "$container status: $STATUS"
        fi
    else
        print_info "$container container not found"
    fi
done

# 5. Network and Ports
print_header "5. Network and Ports"
echo "Listening ports:"
netstat -tuln | grep -E ':(80|443|3000|5432|6379)' || ss -tuln | grep -E ':(80|443|3000|5432|6379)'
echo ""

echo "Docker port mappings:"
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "historian|80|443|3000"

# 6. SSL Certificates
print_header "6. SSL Certificates"
if [ -d "/etc/letsencrypt/live" ]; then
    print_success "Let's Encrypt certificates directory exists"
    echo "Certificates:"
    ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "No certificates found"
    
    for domain in /etc/letsencrypt/live/*/; do
        if [ -d "$domain" ]; then
            DOMAIN_NAME=$(basename "$domain")
            EXPIRY=$(openssl x509 -enddate -noout -in "$domain/cert.pem" 2>/dev/null | cut -d= -f2)
            if [ -n "$EXPIRY" ]; then
                echo "  $DOMAIN_NAME expires: $EXPIRY"
            fi
        fi
    done
else
    print_warning "Let's Encrypt certificates directory not found"
fi

# 7. Logs Check
print_header "7. Recent Logs"
if [ -d "$HISTORIAN_PATH/logs" ]; then
    print_success "Logs directory exists"
    echo "Log files:"
    find "$HISTORIAN_PATH/logs" -type f -name "*.log" -mtime -7 | head -10
    echo ""
    echo "Recent errors (last 20 lines):"
    if [ -f "$HISTORIAN_PATH/logs/production/app.log" ]; then
        tail -20 "$HISTORIAN_PATH/logs/production/app.log" | grep -i "error\|fatal" || echo "No recent errors found"
    fi
else
    print_warning "Logs directory not found"
fi

# 8. Resource Usage
print_header "8. Resource Usage"
echo "Container resource usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || echo "Could not get stats"

# 9. Git Status (if on server)
print_header "9. Git Status"
if [ -d "$HISTORIAN_PATH/.git" ]; then
    cd "$HISTORIAN_PATH" || exit 1
    print_success "Git repository found"
    echo "Current branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
    echo "Last commit: $(git log -1 --format='%h - %s (%ar)' 2>/dev/null || echo 'unknown')"
    echo "Remote: $(git remote -v 2>/dev/null | head -1 || echo 'none')"
else
    print_info "No git repository found (deployment might use rsync)"
fi

# 10. Other Projects Check
print_header "10. Other Projects on Server"
if [ -d "/opt" ]; then
    echo "Projects in /opt:"
    ls -la /opt/ | grep -v "^total"
    echo ""
    
    # Check for WordPress
    if [ -d "/opt/wordpress" ] || [ -d "/opt/wordpress-client" ]; then
        print_info "WordPress directory found"
        find /opt -maxdepth 2 -type d -name "*wordpress*" 2>/dev/null
    else
        print_info "No WordPress project found yet"
    fi
fi

# 11. Summary
print_header "SUMMARY"
echo "Server Status Check completed at $(date)"
echo ""
echo "Next steps:"
echo "1. Review container status above"
echo "2. Check for any warnings or errors"
echo "3. Verify Nginx configuration"
echo "4. Check SSL certificate expiry dates"
echo ""

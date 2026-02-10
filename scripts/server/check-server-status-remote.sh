#!/bin/bash

# Remote Server Status Check - Einfache Version zum direkten Ausführen auf dem Server
# Oder via SSH: ssh root@VPS_IP 'bash -s' < check-server-status-remote.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== HISTORIAN APP SERVER STATUS ===${NC}\n"

# 1. Docker Containers
echo -e "${BLUE}Docker Containers:${NC}"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep -E "historian|NAMES" || echo "No historian containers found"
echo ""

# 2. Historian App Directory
echo -e "${BLUE}Historian App Directory:${NC}"
if [ -d "/opt/historian-app/production" ]; then
    echo -e "${GREEN}✓${NC} /opt/historian-app/production exists"
    cd /opt/historian-app/production
    
    echo ""
    echo "Contents:"
    ls -la | head -15
    
    echo ""
    echo "Docker Compose Status:"
    if [ -f "docker/docker-compose.production.yml" ]; then
        docker-compose -f docker/docker-compose.production.yml ps 2>/dev/null || echo "Could not get status"
    else
        echo "docker-compose.production.yml not found"
        find . -name "docker-compose*.yml" 2>/dev/null
    fi
else
    echo -e "${RED}✗${NC} /opt/historian-app/production not found"
    echo "Checking /opt:"
    ls -la /opt/ | head -10
fi
echo ""

# 3. Nginx Config
echo -e "${BLUE}Nginx Configuration:${NC}"
if [ -f "/opt/historian-app/production/docker/nginx/nginx-ssl.conf" ]; then
    echo -e "${GREEN}✓${NC} Nginx config found"
    echo "Server blocks:"
    grep -E "server_name|listen" /opt/historian-app/production/docker/nginx/nginx-ssl.conf | head -10
else
    echo -e "${YELLOW}⚠${NC} Nginx config not found"
fi
echo ""

# 4. SSL Certificates
echo -e "${BLUE}SSL Certificates:${NC}"
if [ -d "/etc/letsencrypt/live" ]; then
    for domain in /etc/letsencrypt/live/*/; do
        if [ -d "$domain" ]; then
            DOMAIN=$(basename "$domain")
            EXPIRY=$(openssl x509 -enddate -noout -in "$domain/cert.pem" 2>/dev/null | cut -d= -f2)
            echo -e "${GREEN}✓${NC} $DOMAIN expires: $EXPIRY"
        fi
    done
else
    echo -e "${YELLOW}⚠${NC} No SSL certificates found"
fi
echo ""

# 5. Ports
echo -e "${BLUE}Open Ports:${NC}"
netstat -tuln 2>/dev/null | grep -E ':(80|443|3000)' || ss -tuln 2>/dev/null | grep -E ':(80|443|3000)' || echo "Could not check ports"
echo ""

# 6. Other Projects
echo -e "${BLUE}Other Projects in /opt:${NC}"
ls -la /opt/ 2>/dev/null | grep -v "^total" | grep -v "^d" || echo "No other projects found"
echo ""

# 7. System Resources
echo -e "${BLUE}System Resources:${NC}"
echo "Memory:"
free -h
echo ""
echo "Disk:"
df -h / | tail -1
echo ""

echo -e "${GREEN}Status check completed!${NC}\n"

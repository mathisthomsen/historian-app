#!/bin/bash

# Diagnose Script für 504 Gateway Timeout Fehler

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${RED}=== 504 GATEWAY TIMEOUT DIAGNOSE ===${NC}\n"

cd /opt/historian-app/production

# 1. Vollständige Nginx Config prüfen
echo -e "${BLUE}1. Vollständige Nginx Config:${NC}"
if [ -f "nginx/nginx-ssl.conf" ]; then
    echo "Komplette Config:"
    cat nginx/nginx-ssl.conf
    echo ""
    
    # Prüfe ob proxy_pass vorhanden ist
    if grep -q "proxy_pass" nginx/nginx-ssl.conf; then
        echo -e "${GREEN}✓${NC} proxy_pass gefunden"
        grep "proxy_pass" nginx/nginx-ssl.conf
    else
        echo -e "${RED}✗${NC} proxy_pass NICHT gefunden - das ist das Problem!"
    fi
else
    echo -e "${RED}✗${NC} nginx-ssl.conf nicht gefunden"
fi
echo ""

# 2. App Container Status
echo -e "${BLUE}2. App Container Status:${NC}"
if docker ps | grep -q historian-app; then
    echo -e "${GREEN}✓${NC} historian-app Container läuft"
    
    # Container Health Check
    echo "Container Details:"
    docker inspect historian-app --format='Status: {{.State.Status}}, Health: {{.State.Health.Status}}' 2>/dev/null || echo "Keine Health Info"
    
    # Prüfe ob Container auf Port 3000 lauscht
    echo ""
    echo "Ports im Container:"
    docker exec historian-app netstat -tuln 2>/dev/null | grep 3000 || docker exec historian-app ss -tuln 2>/dev/null | grep 3000 || echo "Konnte Ports nicht prüfen"
    
    # Prüfe ob App antwortet (von innerhalb des Containers)
    echo ""
    echo "App Health Check (von Container aus):"
    docker exec historian-app wget -q -O- http://localhost:3000/api/health 2>/dev/null || docker exec historian-app curl -s http://localhost:3000/api/health 2>/dev/null || echo -e "${RED}✗${NC} App antwortet nicht auf Port 3000"
else
    echo -e "${RED}✗${NC} historian-app Container läuft NICHT"
fi
echo ""

# 3. Netzwerk-Verbindung zwischen Nginx und App
echo -e "${BLUE}3. Netzwerk-Verbindung:${NC}"
if docker network ls | grep -q historian-network; then
    echo -e "${GREEN}✓${NC} historian-network existiert"
    
    # Prüfe ob beide Container im gleichen Network sind
    echo "Container im Network:"
    docker network inspect historian-network --format='{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo "Konnte Network nicht inspizieren"
    
    # Prüfe ob Nginx die App erreichen kann
    echo ""
    echo "Nginx -> App Verbindungstest:"
    docker exec historian-nginx wget -q -O- http://historian-app:3000/api/health 2>/dev/null || docker exec historian-nginx curl -s http://historian-app:3000/api/health 2>/dev/null || echo -e "${RED}✗${NC} Nginx kann App nicht erreichen"
else
    echo -e "${RED}✗${NC} historian-network existiert NICHT"
fi
echo ""

# 4. App Container Logs (letzte 50 Zeilen)
echo -e "${BLUE}4. App Container Logs (letzte 50 Zeilen):${NC}"
docker logs historian-app --tail 50 2>&1
echo ""

# 5. Nginx Error Logs
echo -e "${BLUE}5. Nginx Error Logs (letzte 30 Zeilen):${NC}"
if [ -f "logs/nginx/error.log" ]; then
    tail -30 logs/nginx/error.log
else
    echo "Error Log nicht gefunden, versuche aus Container:"
    docker exec historian-nginx tail -30 /var/log/nginx/error.log 2>/dev/null || echo "Konnte Logs nicht lesen"
fi
echo ""

# 6. Nginx Access Logs (letzte 20 Zeilen)
echo -e "${BLUE}6. Nginx Access Logs (letzte 20 Zeilen):${NC}"
if [ -f "logs/nginx/access.log" ]; then
    tail -20 logs/nginx/access.log
else
    docker exec historian-nginx tail -20 /var/log/nginx/access.log 2>/dev/null || echo "Konnte Logs nicht lesen"
fi
echo ""

# 7. Docker Compose Status
echo -e "${BLUE}7. Docker Compose Status:${NC}"
docker-compose -f docker-compose.production.yml ps 2>/dev/null || echo "Konnte docker-compose Status nicht prüfen"
echo ""

# 8. Environment Variablen im App Container
echo -e "${BLUE}8. App Container Environment (wichtig):${NC}"
docker exec historian-app env | grep -E "PORT|NODE_ENV|DATABASE_URL|HOSTNAME" | head -10 || echo "Konnte Environment nicht lesen"
echo ""

# 9. Prüfe ob App-Prozess läuft
echo -e "${BLUE}9. App-Prozess im Container:${NC}"
docker exec historian-app ps aux | grep -E "node|next" | head -5 || echo "Keine Node-Prozesse gefunden"
echo ""

# 10. Nginx Config Syntax Check
echo -e "${BLUE}10. Nginx Config Syntax:${NC}"
docker exec historian-nginx nginx -t 2>&1 || echo "Nginx Config hat Syntax-Fehler"
echo ""

echo -e "${YELLOW}=== ZUSAMMENFASSUNG ===${NC}"
echo "Bitte prüfe:"
echo "1. Ist proxy_pass in der Nginx Config vorhanden?"
echo "2. Läuft die App auf Port 3000?"
echo "3. Können Nginx und App kommunizieren (gleiches Network)?"
echo "4. Gibt es Fehler in den App-Logs?"
echo ""

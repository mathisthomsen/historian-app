#!/bin/bash

# Tiefere Diagnose für 504 - fokussiert auf App-Logs und direkte Tests

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${RED}=== TIEFERE 504 DIAGNOSE ===${NC}\n"

cd /opt/historian-app/production

# 1. App Container Logs - DAS IST WICHTIG!
echo -e "${BLUE}1. App Container Logs (letzte 100 Zeilen):${NC}"
echo "=========================================="
docker logs historian-app --tail 100 2>&1
echo "=========================================="
echo ""

# 2. Prüfe ob App-Prozess läuft
echo -e "${BLUE}2. App-Prozesse im Container:${NC}"
docker exec historian-app ps aux 2>/dev/null | grep -E "node|next|PID" | head -10
echo ""

# 3. Direkter HTTP Test (ohne curl/wget)
echo -e "${BLUE}3. Direkter Port-Test:${NC}"
# Prüfe ob Port wirklich offen ist
docker exec historian-app sh -c 'nc -z localhost 3000 && echo "Port 3000 ist offen" || echo "Port 3000 ist geschlossen"' 2>/dev/null || echo "nc nicht verfügbar"
echo ""

# 4. Test von außerhalb des Containers
echo -e "${BLUE}4. Test von Host aus:${NC}"
# Versuche direkt auf den Container-Port zuzugreifen
docker port historian-app 2>/dev/null || echo "Keine Port-Mappings gefunden"
echo ""

# 5. Nginx Error Logs - SEHR WICHTIG!
echo -e "${BLUE}5. Nginx Error Logs (letzte 50 Zeilen):${NC}"
echo "=========================================="
if [ -f "logs/nginx/error.log" ]; then
    tail -50 logs/nginx/error.log
else
    docker exec historian-nginx cat /var/log/nginx/error.log 2>/dev/null | tail -50 || echo "Konnte Error Log nicht lesen"
fi
echo "=========================================="
echo ""

# 6. Nginx Access Logs
echo -e "${BLUE}6. Nginx Access Logs (letzte 20 Zeilen):${NC}"
if [ -f "logs/nginx/access.log" ]; then
    tail -20 logs/nginx/access.log
else
    docker exec historian-nginx cat /var/log/nginx/access.log 2>/dev/null | tail -20 || echo "Konnte Access Log nicht lesen"
fi
echo ""

# 7. Test ob Nginx die App erreichen kann (mit wget)
echo -e "${BLUE}7. Nginx -> App Verbindungstest:${NC}"
# Versuche mit wget (meist verfügbar in nginx Container)
docker exec historian-nginx wget -q -O- --timeout=5 http://historian-app:3000 2>&1 | head -20 || \
docker exec historian-nginx wget -q -O- --timeout=5 http://historian-app:3000/api/health 2>&1 | head -20 || \
echo -e "${RED}✗${NC} Nginx kann App nicht erreichen (Timeout oder Fehler)"
echo ""

# 8. DNS Resolution Test
echo -e "${BLUE}8. DNS Resolution Test:${NC}"
docker exec historian-nginx nslookup historian-app 2>/dev/null || \
docker exec historian-nginx getent hosts historian-app 2>/dev/null || \
echo "DNS Resolution fehlgeschlagen"
echo ""

# 9. Network Connectivity
echo -e "${BLUE}9. Network Connectivity:${NC}"
# Prüfe ob beide Container im gleichen Network sind
APP_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' historian-app 2>/dev/null)
NGINX_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' historian-nginx 2>/dev/null)

echo "App Container IP: $APP_IP"
echo "Nginx Container IP: $NGINX_IP"

if [ -n "$APP_IP" ] && [ -n "$NGINX_IP" ]; then
    echo "Versuche Ping von Nginx zu App..."
    docker exec historian-nginx ping -c 2 historian-app 2>&1 | head -5 || echo "Ping fehlgeschlagen"
fi
echo ""

# 10. Environment Variablen im App Container
echo -e "${BLUE}10. App Environment (wichtig):${NC}"
docker exec historian-app env | grep -E "PORT|NODE_ENV|DATABASE|HOSTNAME|NEXT" | head -15
echo ""

# 11. Prüfe ob server.js existiert
echo -e "${BLUE}11. App Dateien prüfen:${NC}"
docker exec historian-app ls -la /app 2>/dev/null | head -15 || echo "Konnte /app nicht lesen"
echo ""
docker exec historian-app ls -la /app/server.js 2>/dev/null && echo -e "${GREEN}✓${NC} server.js gefunden" || echo -e "${RED}✗${NC} server.js nicht gefunden"
echo ""

# 12. Container Restart Count
echo -e "${BLUE}12. Container Restart Count:${NC}"
docker inspect historian-app --format='RestartCount: {{.RestartCount}}' 2>/dev/null
docker inspect historian-nginx --format='RestartCount: {{.RestartCount}}' 2>/dev/null
echo ""

# 13. Memory/CPU Usage
echo -e "${BLUE}13. Container Ressourcen:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" historian-app historian-nginx 2>/dev/null || echo "Konnte Stats nicht abrufen"
echo ""

echo -e "${YELLOW}=== ZUSAMMENFASSUNG ===${NC}"
echo ""
echo "WICHTIG: Prüfe besonders:"
echo "1. App Logs (oben) - suche nach Fehlern, Crashes, Database-Connection-Problemen"
echo "2. Nginx Error Logs - suche nach 'upstream', 'timeout', 'connection refused'"
echo "3. Ob server.js existiert und die App richtig gebaut wurde"
echo "4. Environment Variablen - besonders DATABASE_URL"
echo ""
echo "Häufige Probleme:"
echo "- App stürzt beim Start ab (siehe Logs)"
echo "- Database Connection fehlt oder falsch"
echo "- App wurde nicht richtig gebaut (server.js fehlt)"
echo "- Port 3000 lauscht, aber App antwortet nicht (Next.js Problem)"
echo ""

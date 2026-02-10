#!/bin/bash

# Prüfe App nach Neubau

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== APP STATUS NACH NEUBAU ===${NC}\n"

cd /opt/historian-app/production

# 1. Container Status
echo -e "${BLUE}1. Container Status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}" | grep historian
echo ""

# 2. App Logs (letzte 20 Zeilen)
echo -e "${BLUE}2. App Logs (letzte 20 Zeilen):${NC}"
docker logs historian-app --tail 20 2>&1
echo ""

# 3. Test ob App antwortet
echo -e "${BLUE}3. App Health Check:${NC}"
sleep 2

# Test von Nginx aus
if docker exec historian-nginx wget -q -O- --timeout=5 http://historian-app:3000 2>&1 | head -5; then
    echo -e "${GREEN}✓${NC} App antwortet auf Port 3000"
else
    echo -e "${RED}✗${NC} App antwortet nicht"
    echo "Prüfe Logs: docker logs historian-app --tail 50"
fi
echo ""

# 4. Nginx Error Logs
echo -e "${BLUE}4. Nginx Error Logs (letzte 10 Zeilen):${NC}"
docker exec historian-nginx tail -10 /var/log/nginx/error.log 2>/dev/null | tail -10 || echo "Keine Fehler"
echo ""

# 5. Test von außen
echo -e "${BLUE}5. Externer Test:${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://evidoxa.com 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✓${NC} Website antwortet (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "504" ]; then
    echo -e "${RED}✗${NC} Immer noch 504 Gateway Timeout"
    echo "Prüfe App-Logs: docker logs historian-app --tail 100"
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${YELLOW}⚠${NC} Keine Antwort (Timeout oder DNS Problem)"
else
    echo -e "${YELLOW}⚠${NC} HTTP $HTTP_CODE"
fi
echo ""

# 6. Verdächtige Prozesse prüfen
echo -e "${BLUE}6. Container Prozesse:${NC}"
docker exec historian-app ps aux 2>/dev/null | head -10
echo ""

echo -e "${GREEN}=== PRÜFUNG ABGESCHLOSSEN ===${NC}"
echo ""
if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "301" ] && [ "$HTTP_CODE" != "302" ]; then
    echo "App funktioniert noch nicht richtig."
    echo "Nächste Schritte:"
    echo "1. docker logs historian-app --tail 100"
    echo "2. Prüfe ob Database Connection funktioniert"
    echo "3. Prüfe Environment Variablen"
fi

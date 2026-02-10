#!/bin/bash

# Fix Nginx nach Container-Neubau

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== NGINX FIX NACH NEUBAU ===${NC}\n"

cd /opt/historian-app/production

# 1. Prüfe App Container IP
echo -e "${BLUE}1. App Container IP:${NC}"
APP_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' historian-app 2>/dev/null)
echo "App Container IP: $APP_IP"
echo ""

# 2. Test ob App von Nginx erreichbar ist
echo -e "${BLUE}2. Test App-Erreichbarkeit von Nginx:${NC}"
if docker exec historian-nginx wget -q -O- --timeout=5 http://historian-app:3000 2>&1 | head -1 | grep -q "DOCTYPE\|html"; then
    echo -e "${GREEN}✓${NC} App ist von Nginx erreichbar"
else
    echo -e "${YELLOW}⚠${NC} App-Erreichbarkeit unklar"
fi
echo ""

# 3. Nginx Config prüfen
echo -e "${BLUE}3. Nginx Config prüfen:${NC}"
if docker exec historian-nginx nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓${NC} Nginx Config ist gültig"
else
    echo -e "${RED}✗${NC} Nginx Config hat Fehler:"
    docker exec historian-nginx nginx -t
    exit 1
fi
echo ""

# 4. Nginx neu laden
echo -e "${BLUE}4. Nginx neu laden:${NC}"
if docker exec historian-nginx nginx -s reload 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Nginx erfolgreich neu geladen"
else
    echo -e "${YELLOW}⚠${NC} Nginx Reload fehlgeschlagen, versuche Restart..."
    docker-compose -f docker-compose.production.yml restart nginx
    sleep 2
fi
echo ""

# 5. Test von außen
echo -e "${BLUE}5. Externer Test (warte 3 Sekunden...):${NC}"
sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://evidoxa.com 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Website funktioniert! (HTTP 200)"
elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✓${NC} Website funktioniert! (HTTP $HTTP_CODE - Redirect)"
elif [ "$HTTP_CODE" = "504" ]; then
    echo -e "${RED}✗${NC} Immer noch 504 Gateway Timeout"
    echo ""
    echo "Prüfe:"
    echo "1. docker logs historian-app --tail 50"
    echo "2. docker exec historian-nginx tail -20 /var/log/nginx/error.log"
    echo "3. Prüfe ob beide Container im gleichen Network sind:"
    echo "   docker network inspect historian-network"
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${YELLOW}⚠${NC} Keine Antwort (Timeout)"
    echo "Das könnte ein DNS-Problem sein oder die App antwortet zu langsam"
else
    echo -e "${YELLOW}⚠${NC} HTTP $HTTP_CODE"
fi
echo ""

# 6. Nginx Error Logs (neueste)
echo -e "${BLUE}6. Neueste Nginx Error Logs:${NC}"
docker exec historian-nginx tail -5 /var/log/nginx/error.log 2>/dev/null | tail -5 || echo "Keine neuen Fehler"
echo ""

# 7. Network Status
echo -e "${BLUE}7. Network Status:${NC}"
echo "Container im Network:"
docker network inspect historian-network --format='{{range .Containers}}{{.Name}} ({{.IPv4Address}}){{"\n"}}{{end}}' 2>/dev/null | grep historian || echo "Konnte Network nicht inspizieren"
echo ""

echo -e "${GREEN}=== FIX ABGESCHLOSSEN ===${NC}"
echo ""
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✓${NC} Website sollte jetzt funktionieren!"
    echo "Teste: https://evidoxa.com"
else
    echo "Website funktioniert noch nicht. Prüfe die Logs oben."
fi
echo ""

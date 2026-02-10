#!/bin/bash

# Fix Script für 504 Gateway Timeout - Behebt häufige Probleme

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${YELLOW}=== 504 ERROR FIX SCRIPT ===${NC}\n"

cd /opt/historian-app/production

# 1. Prüfe ob App Container läuft und antwortet
echo -e "${BLUE}1. Prüfe App Container...${NC}"
if ! docker ps | grep -q historian-app; then
    echo -e "${RED}✗${NC} App Container läuft nicht - starte neu..."
    docker-compose -f docker-compose.production.yml up -d app
    sleep 5
else
    echo -e "${GREEN}✓${NC} App Container läuft"
fi

# 2. Prüfe ob App auf Port 3000 antwortet
echo -e "${BLUE}2. Prüfe App Health...${NC}"
for i in {1..10}; do
    if docker exec historian-app wget -q -O- http://localhost:3000/api/health 2>/dev/null || \
       docker exec historian-app curl -s http://localhost:3000/api/health 2>/dev/null || \
       docker exec historian-app wget -q -O- http://localhost:3000 2>/dev/null; then
        echo -e "${GREEN}✓${NC} App antwortet auf Port 3000"
        break
    else
        echo "Versuch $i/10: App antwortet noch nicht, warte 3 Sekunden..."
        sleep 3
    fi
done

# 3. Prüfe Netzwerk-Verbindung
echo -e "${BLUE}3. Prüfe Netzwerk-Verbindung...${NC}"
if docker exec historian-nginx wget -q -O- http://historian-app:3000/api/health 2>/dev/null || \
   docker exec historian-nginx curl -s http://historian-app:3000/api/health 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Nginx kann App erreichen"
else
    echo -e "${RED}✗${NC} Nginx kann App NICHT erreichen"
    echo "Prüfe Network..."
    
    # Prüfe ob beide im gleichen Network sind
    APP_NETWORK=$(docker inspect historian-app --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' 2>/dev/null)
    NGINX_NETWORK=$(docker inspect historian-nginx --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' 2>/dev/null)
    
    if [ "$APP_NETWORK" != "$NGINX_NETWORK" ]; then
        echo -e "${RED}✗${NC} Container sind in verschiedenen Networks!"
        echo "App Network: $APP_NETWORK"
        echo "Nginx Network: $NGINX_NETWORK"
        echo ""
        echo "Lösung: Container neu starten..."
        docker-compose -f docker-compose.production.yml down
        docker-compose -f docker-compose.production.yml up -d
        sleep 10
    fi
fi

# 4. Prüfe App Logs auf Fehler
echo -e "${BLUE}4. Prüfe App Logs...${NC}"
ERRORS=$(docker logs historian-app --tail 50 2>&1 | grep -i "error\|fatal\|crash\|exit" | head -5)
if [ -n "$ERRORS" ]; then
    echo -e "${YELLOW}⚠${NC} Fehler in App Logs gefunden:"
    echo "$ERRORS"
    echo ""
    echo "Vollständige Logs:"
    docker logs historian-app --tail 20
else
    echo -e "${GREEN}✓${NC} Keine kritischen Fehler in Logs"
fi

# 5. Prüfe Nginx Config
echo -e "${BLUE}5. Prüfe Nginx Config...${NC}"
if docker exec historian-nginx nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓${NC} Nginx Config ist gültig"
    
    # Prüfe ob proxy_pass vorhanden ist
    if docker exec historian-nginx cat /etc/nginx/nginx.conf | grep -q "proxy_pass.*historian-app"; then
        echo -e "${GREEN}✓${NC} proxy_pass Konfiguration vorhanden"
    else
        echo -e "${RED}✗${NC} proxy_pass fehlt in Config!"
        echo "Nginx Config muss aktualisiert werden"
    fi
else
    echo -e "${RED}✗${NC} Nginx Config hat Fehler:"
    docker exec historian-nginx nginx -t
fi

# 6. Nginx Reload
echo -e "${BLUE}6. Nginx Reload...${NC}"
docker exec historian-nginx nginx -s reload 2>/dev/null && echo -e "${GREEN}✓${NC} Nginx neu geladen" || echo -e "${YELLOW}⚠${NC} Nginx Reload fehlgeschlagen"

# 7. Finaler Test
echo -e "${BLUE}7. Finaler Test...${NC}"
sleep 2
if docker exec historian-nginx curl -s -o /dev/null -w "%{http_code}" http://historian-app:3000/api/health 2>/dev/null | grep -q "200\|404"; then
    echo -e "${GREEN}✓${NC} App ist erreichbar"
else
    echo -e "${RED}✗${NC} App ist immer noch nicht erreichbar"
    echo ""
    echo "Mögliche Lösungen:"
    echo "1. Container komplett neu starten:"
    echo "   cd /opt/historian-app/production"
    echo "   docker-compose -f docker-compose.production.yml restart"
    echo ""
    echo "2. App Container Logs prüfen:"
    echo "   docker logs historian-app --tail 100"
    echo ""
    echo "3. Prüfe ob App richtig gebaut wurde:"
    echo "   docker exec historian-app ls -la /app"
fi

echo ""
echo -e "${BLUE}=== DIAGNOSE ABGESCHLOSSEN ===${NC}"
echo ""
echo "Nächste Schritte:"
echo "1. Teste die Seite: https://evidoxa.com"
echo "2. Falls immer noch 504: docker logs historian-app --tail 100"
echo "3. Falls immer noch 504: docker-compose -f docker-compose.production.yml restart"

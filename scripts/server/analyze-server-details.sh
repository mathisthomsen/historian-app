#!/bin/bash

# Detaillierte Server-Analyse basierend auf den gefundenen Ergebnissen

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== DETAILLIERTE SERVER-ANALYSE ===${NC}\n"

cd /opt/historian-app/production

# 1. Docker Compose Datei finden und prüfen
echo -e "${BLUE}1. Docker Compose Konfiguration:${NC}"
if [ -f "docker-compose.production.yml" ]; then
    echo -e "${GREEN}✓${NC} docker-compose.production.yml gefunden"
    echo "Services:"
    grep -E "^  [a-z-]+:" docker-compose.production.yml | sed 's/://' | sed 's/^/  - /'
else
    echo -e "${YELLOW}⚠${NC} docker-compose.production.yml nicht im Root gefunden"
fi
echo ""

# 2. Nginx Config finden
echo -e "${BLUE}2. Nginx Konfiguration suchen:${NC}"
NGINX_CONFIGS=$(find . -name "nginx*.conf" -type f 2>/dev/null | head -10)
if [ -n "$NGINX_CONFIGS" ]; then
    echo -e "${GREEN}✓${NC} Nginx Configs gefunden:"
    echo "$NGINX_CONFIGS" | sed 's/^/  /'
    echo ""
    echo "Aktive Nginx Config (vom Container):"
    docker exec historian-nginx cat /etc/nginx/nginx.conf 2>/dev/null | head -50 || echo "Konnte Config nicht aus Container lesen"
else
    echo -e "${YELLOW}⚠${NC} Keine Nginx Configs gefunden"
fi
echo ""

# 3. Container Volumes prüfen
echo -e "${BLUE}3. Docker Volumes:${NC}"
docker volume ls | grep historian || echo "Keine historian Volumes gefunden"
echo ""

# 4. Nginx Container Details
echo -e "${BLUE}4. Nginx Container Details:${NC}"
docker inspect historian-nginx --format='{{range .Mounts}}{{.Source}} -> {{.Destination}} ({{.Type}}){{"\n"}}{{end}}' 2>/dev/null || echo "Konnte Nginx Container nicht inspizieren"
echo ""

# 5. SSL Zertifikate suchen
echo -e "${BLUE}5. SSL Zertifikate suchen:${NC}"
# Verschiedene mögliche Pfade prüfen
SSL_PATHS=(
    "/etc/letsencrypt/live"
    "/opt/historian-app/production/ssl"
    "/opt/historian-app/production/certbot"
    "/var/lib/docker/volumes"
)

for path in "${SSL_PATHS[@]}"; do
    if [ -d "$path" ]; then
        echo "Prüfe: $path"
        find "$path" -name "*.pem" -o -name "*.crt" 2>/dev/null | head -5
    fi
done

# In Docker Volumes suchen
echo ""
echo "SSL in Docker Volumes:"
docker volume ls | grep -E "certbot|ssl" || echo "Keine SSL Volumes gefunden"
echo ""

# 6. Aktuelle Nginx Config aus Container
echo -e "${BLUE}6. Aktuelle Nginx Config (aus Container):${NC}"
if docker ps | grep -q historian-nginx; then
    echo "Server Blocks:"
    docker exec historian-nginx cat /etc/nginx/nginx.conf 2>/dev/null | grep -E "server_name|listen" | head -10 || echo "Konnte Config nicht lesen"
else
    echo "Nginx Container läuft nicht"
fi
echo ""

# 7. Container Logs (letzte Fehler)
echo -e "${BLUE}7. Letzte Container Logs (Fehler):${NC}"
echo "historian-app (letzte 10 Zeilen):"
docker logs historian-app --tail 10 2>&1 | grep -i "error\|fatal\|warn" || echo "Keine Fehler gefunden"
echo ""
echo "historian-nginx (letzte 10 Zeilen):"
docker logs historian-nginx --tail 10 2>&1 | grep -i "error\|fatal\|warn" || echo "Keine Fehler gefunden"
echo ""

# 8. Verzeichnisstruktur detailliert
echo -e "${BLUE}8. Verzeichnisstruktur:${NC}"
echo "Docker Verzeichnis:"
if [ -d "docker" ]; then
    find docker -type f -name "*.yml" -o -name "*.conf" 2>/dev/null | head -20
else
    echo "docker/ Verzeichnis nicht gefunden"
fi
echo ""

# 9. .env Datei prüfen
echo -e "${BLUE}9. Environment Variablen:${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env Datei gefunden"
    echo "Wichtige Variablen (sanitized):"
    grep -E "^DOMAIN=|^DATABASE_URL=|^NEXTAUTH_URL=" .env | sed 's/=.*/=***/' || echo "Keine relevanten Variablen gefunden"
else
    echo -e "${YELLOW}⚠${NC} .env Datei nicht gefunden"
fi
echo ""

# 10. Domain/Server Name aus Nginx
echo -e "${BLUE}10. Konfigurierte Domains:${NC}"
if docker ps | grep -q historian-nginx; then
    docker exec historian-nginx cat /etc/nginx/nginx.conf 2>/dev/null | grep -E "server_name" | sed 's/.*server_name//' | sed 's/;//' || echo "Konnte Domains nicht extrahieren"
else
    echo "Nginx Container läuft nicht"
fi
echo ""

echo -e "${GREEN}Analyse abgeschlossen!${NC}\n"

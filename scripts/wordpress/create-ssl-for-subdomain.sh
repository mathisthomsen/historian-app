#!/bin/bash

# SSL-Zertifikat für WordPress Subdomain erstellen

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== SSL ZERTIFIKAT FÜR SUBDOMAIN ===${NC}\n"

cd /opt/historian-app/production

# Lade .env
if [ -f ".env" ]; then
    source .env
    SSL_EMAIL=${SSL_EMAIL:-admin@evidoxa.com}
else
    SSL_EMAIL="admin@evidoxa.com"
fi

SUBDOMAIN="bhgv.evidoxa.com"

echo "Subdomain: $SUBDOMAIN"
echo "Email: $SSL_EMAIL"
echo ""

# 1. Stelle sicher, dass Nginx läuft
echo -e "${BLUE}1. Prüfe Nginx Status:${NC}"
if ! docker ps | grep -q historian-nginx; then
    echo "Starte Nginx..."
    docker-compose -f docker-compose.production.yml up -d nginx
    sleep 3
fi
echo -e "${GREEN}✓${NC} Nginx läuft"
echo ""

# 2. Erstelle SSL-Zertifikat für Subdomain
echo -e "${BLUE}2. Erstelle SSL-Zertifikat:${NC}"
echo "Dies kann einige Minuten dauern..."

docker run --rm \
    -v production_certbot-etc:/etc/letsencrypt \
    -v production_certbot-www:/var/www/certbot \
    --network production_historian-network \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$SSL_EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$SUBDOMAIN" \
    --non-interactive \
    2>&1 | tee /tmp/certbot-subdomain-output.log

CERTBOT_EXIT=$?

if [ $CERTBOT_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} SSL-Zertifikat erfolgreich erstellt!"
else
    echo -e "${RED}✗${NC} Zertifikat-Erstellung fehlgeschlagen"
    echo ""
    echo "Letzte Zeilen der Ausgabe:"
    tail -20 /tmp/certbot-subdomain-output.log
    echo ""
    echo "Prüfe:"
    echo "1. DNS zeigt auf den Server? (A-Record für $SUBDOMAIN)"
    echo "2. Port 80 ist erreichbar?"
    exit 1
fi
echo ""

# 3. Prüfe Zertifikat
echo -e "${BLUE}3. Prüfe Zertifikat:${NC}"
VOLUME_PATH=$(docker volume inspect production_certbot-etc --format '{{.Mountpoint}}')
CERT_PATH="$VOLUME_PATH/live/$SUBDOMAIN/fullchain.pem"

if [ -f "$CERT_PATH" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_PATH" 2>/dev/null | cut -d= -f2)
    echo -e "${GREEN}✓${NC} Zertifikat gefunden"
    echo "Ablaufdatum: $EXPIRY"
else
    echo -e "${RED}✗${NC} Zertifikat-Datei nicht gefunden"
fi
echo ""

# 4. Nginx neu laden
echo -e "${BLUE}4. Nginx neu laden:${NC}"
if docker exec historian-nginx nginx -s reload 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Nginx erfolgreich neu geladen"
else
    echo -e "${YELLOW}⚠${NC} Nginx Reload fehlgeschlagen, versuche Restart..."
    docker-compose -f docker-compose.production.yml restart nginx
    sleep 3
fi
echo ""

# 5. Finaler Test
echo -e "${BLUE}5. Finaler SSL-Test:${NC}"
sleep 3

SSL_TEST=$(echo | timeout 10 openssl s_client -connect "$SUBDOMAIN:443" -servername "$SUBDOMAIN" 2>/dev/null | grep -E "Verify return code" | head -1 || echo "")

if [ -n "$SSL_TEST" ]; then
    echo "$SSL_TEST"
    if echo "$SSL_TEST" | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✓${NC} SSL-Zertifikat ist gültig!"
    else
        echo -e "${YELLOW}⚠${NC} SSL-Verifizierung hat Warnungen"
    fi
else
    echo -e "${YELLOW}⚠${NC} SSL-Test konnte nicht durchgeführt werden"
fi
echo ""

echo -e "${GREEN}=== SSL-SETUP ABGESCHLOSSEN ===${NC}"
echo ""
echo "Nächste Schritte:"
echo "1. Teste die Subdomain: https://$SUBDOMAIN"
echo "2. Prüfe ob die SSL-Warnung verschwunden ist"
echo ""

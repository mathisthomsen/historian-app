#!/bin/bash

# SSL Zertifikat neu erstellen (force renewal)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== SSL ZERTIFIKAT NEU ERSTELLEN ===${NC}\n"

cd /opt/historian-app/production

# Lade .env für Domain und Email
if [ -f ".env" ]; then
    source .env
    DOMAIN=${DOMAIN:-evidoxa.com}
    SSL_EMAIL=${SSL_EMAIL:-admin@evidoxa.com}
else
    DOMAIN="evidoxa.com"
    SSL_EMAIL="admin@evidoxa.com"
    echo -e "${YELLOW}⚠${NC} .env nicht gefunden, verwende Standardwerte"
fi

echo "Domain: $DOMAIN"
echo "Email: $SSL_EMAIL"
echo ""

# 1. Stelle sicher, dass Nginx läuft (für ACME Challenge)
echo -e "${BLUE}1. Prüfe Nginx Status:${NC}"
if ! docker ps | grep -q historian-nginx; then
    echo "Starte Nginx..."
    docker-compose -f docker-compose.production.yml up -d nginx
    sleep 3
fi
echo -e "${GREEN}✓${NC} Nginx läuft"
echo ""

# 2. Erstelle neues Zertifikat mit certonly (force renewal)
echo -e "${BLUE}2. Erstelle neues Zertifikat (inkl. www Subdomain):${NC}"
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
    --force-renewal \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --non-interactive \
    2>&1 | tee /tmp/certbot-output.log

CERTBOT_EXIT=$?

if [ $CERTBOT_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Zertifikat erfolgreich erstellt!"
else
    echo -e "${RED}✗${NC} Zertifikat-Erstellung fehlgeschlagen"
    echo ""
    echo "Letzte Zeilen der Ausgabe:"
    tail -20 /tmp/certbot-output.log
    echo ""
    echo "Prüfe:"
    echo "1. Ist Port 80 erreichbar? (für ACME Challenge)"
    echo "2. Zeigt DNS auf den Server?"
    echo "3. Ist .well-known/acme-challenge/ erreichbar?"
    exit 1
fi
echo ""

# 3. Prüfe neues Zertifikat
echo -e "${BLUE}3. Prüfe neues Zertifikat:${NC}"
VOLUME_PATH=$(docker volume inspect production_certbot-etc --format '{{.Mountpoint}}')
CERT_PATH="$VOLUME_PATH/live/$DOMAIN/fullchain.pem"

if [ -f "$CERT_PATH" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_PATH" 2>/dev/null | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" +%s 2>/dev/null || echo "0")
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
    
    echo "Ablaufdatum: $EXPIRY"
    echo "Tage bis Ablauf: $DAYS_LEFT"
    
    # Prüfe Domains
    DOMAINS=$(openssl x509 -in "$CERT_PATH" -text -noout 2>/dev/null | grep -A1 "Subject Alternative Name" | grep DNS | sed 's/DNS://g' | tr ',' '\n' | sed 's/^ *//')
    echo ""
    echo "Zertifizierte Domains:"
    echo "$DOMAINS" | sed 's/^/  - /'
    
    if echo "$DOMAINS" | grep -q "www.$DOMAIN"; then
        echo -e "${GREEN}✓${NC} www.$DOMAIN ist enthalten"
    else
        echo -e "${YELLOW}⚠${NC} www.$DOMAIN ist NICHT enthalten"
    fi
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

# 5. Finaler SSL-Test
echo -e "${BLUE}5. Finaler SSL-Test:${NC}"
sleep 3

# Test mit openssl
SSL_TEST=$(echo | timeout 10 openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | grep -E "Verify return code|CN=" | head -3 || echo "")

if [ -n "$SSL_TEST" ]; then
    echo "$SSL_TEST"
    if echo "$SSL_TEST" | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✓${NC} SSL-Zertifikat ist gültig!"
    else
        VERIFY_CODE=$(echo "$SSL_TEST" | grep "Verify return code" | sed 's/.*Verify return code: //' | sed 's/ .*//')
        echo -e "${YELLOW}⚠${NC} SSL-Verifizierung Code: $VERIFY_CODE"
        case "$VERIFY_CODE" in
            10) echo "  → Zertifikat ist abgelaufen" ;;
            19) echo "  → Self-signed certificate" ;;
            *) echo "  → Anderes Problem (Code: $VERIFY_CODE)" ;;
        esac
    fi
else
    echo -e "${YELLOW}⚠${NC} SSL-Test konnte nicht durchgeführt werden"
fi
echo ""

# 6. Test www Subdomain
echo -e "${BLUE}6. Test www Subdomain:${NC}"
SSL_TEST_WWW=$(echo | timeout 10 openssl s_client -connect "www.$DOMAIN:443" -servername "www.$DOMAIN" 2>/dev/null | grep -E "Verify return code" | head -1 || echo "")
if [ -n "$SSL_TEST_WWW" ]; then
    echo "$SSL_TEST_WWW"
    if echo "$SSL_TEST_WWW" | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✓${NC} www.$DOMAIN SSL ist gültig!"
    else
        echo -e "${YELLOW}⚠${NC} www.$DOMAIN SSL hat Probleme"
    fi
else
    echo -e "${YELLOW}⚠${NC} www.$DOMAIN SSL-Test fehlgeschlagen"
fi
echo ""

echo -e "${GREEN}=== ZERTIFIKAT-ERNEUERUNG ABGESCHLOSSEN ===${NC}"
echo ""
echo "Nächste Schritte:"
echo "1. Teste die Website: https://$DOMAIN"
echo "2. Teste www Subdomain: https://www.$DOMAIN"
echo "3. Prüfe ob die SSL-Warnung verschwunden ist"
echo ""
echo "Falls immer noch Probleme:"
echo "- Warte 1-2 Minuten (DNS/Propagation)"
echo "- Leere Browser-Cache"
echo "- Prüfe Browser-Konsole für Details"
echo ""

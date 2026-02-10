#!/bin/bash

# SSL Zertifikat prüfen und reparieren

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== SSL ZERTIFIKAT PRÜFUNG ===${NC}\n"

cd /opt/historian-app/production

# 1. Prüfe Zertifikat-Ablaufdatum
echo -e "${BLUE}1. Zertifikat-Ablaufdatum:${NC}"
CERT_PATH="/etc/letsencrypt/live/evidoxa.com/fullchain.pem"

# Prüfe ob Zertifikat im Volume existiert
if docker volume inspect production_certbot-etc >/dev/null 2>&1; then
    VOLUME_PATH=$(docker volume inspect production_certbot-etc --format '{{.Mountpoint}}')
    CERT_PATH_VOLUME="$VOLUME_PATH/live/evidoxa.com/fullchain.pem"
    
    if [ -f "$CERT_PATH_VOLUME" ]; then
        EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_PATH_VOLUME" 2>/dev/null | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" +%s 2>/dev/null || echo "0")
        NOW_EPOCH=$(date +%s)
        DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
        
        echo "Zertifikat läuft ab: $EXPIRY"
        if [ "$DAYS_LEFT" -lt 0 ]; then
            echo -e "${RED}✗${NC} Zertifikat ist ABGELAUFEN!"
        elif [ "$DAYS_LEFT" -lt 30 ]; then
            echo -e "${YELLOW}⚠${NC} Zertifikat läuft in $DAYS_LEFT Tagen ab"
        else
            echo -e "${GREEN}✓${NC} Zertifikat ist noch $DAYS_LEFT Tage gültig"
        fi
    else
        echo -e "${RED}✗${NC} Zertifikat nicht gefunden in Volume"
    fi
else
    echo -e "${YELLOW}⚠${NC} Certbot Volume nicht gefunden"
fi
echo ""

# 2. Prüfe Zertifikat-Domains
echo -e "${BLUE}2. Zertifikat-Domains:${NC}"
if [ -f "$CERT_PATH_VOLUME" ]; then
    DOMAINS=$(openssl x509 -in "$CERT_PATH_VOLUME" -text -noout 2>/dev/null | grep -A1 "Subject Alternative Name" | grep DNS | sed 's/DNS://g' | tr ',' '\n' | sed 's/^ *//')
    echo "Zertifizierte Domains:"
    echo "$DOMAINS" | sed 's/^/  - /'
    
    # Prüfe ob www.evidoxa.com enthalten ist
    if echo "$DOMAINS" | grep -q "www.evidoxa.com"; then
        echo -e "${GREEN}✓${NC} www.evidoxa.com ist enthalten"
    else
        echo -e "${YELLOW}⚠${NC} www.evidoxa.com ist NICHT enthalten"
        echo "Das könnte das Problem sein!"
    fi
else
    echo -e "${RED}✗${NC} Konnte Zertifikat nicht prüfen"
fi
echo ""

# 3. Prüfe Zertifikat im Container
echo -e "${BLUE}3. Zertifikat im Nginx Container:${NC}"
if docker exec historian-nginx test -f /etc/letsencrypt/live/evidoxa.com/fullchain.pem 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Zertifikat ist im Container verfügbar"
    
    # Prüfe Ablaufdatum im Container
    EXPIRY_CONTAINER=$(docker exec historian-nginx openssl x509 -enddate -noout -in /etc/letsencrypt/live/evidoxa.com/fullchain.pem 2>/dev/null | cut -d= -f2)
    echo "Ablaufdatum im Container: $EXPIRY_CONTAINER"
else
    echo -e "${RED}✗${NC} Zertifikat nicht im Container gefunden"
fi
echo ""

# 4. Test SSL-Verbindung
echo -e "${BLUE}4. SSL-Verbindungstest:${NC}"
SSL_TEST=$(echo | openssl s_client -connect evidoxa.com:443 -servername evidoxa.com 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
if [ -n "$SSL_TEST" ]; then
    echo -e "${GREEN}✓${NC} SSL-Verbindung funktioniert"
    echo "$SSL_TEST"
else
    echo -e "${YELLOW}⚠${NC} SSL-Test fehlgeschlagen"
fi
echo ""

# 5. Certbot Renewal
echo -e "${BLUE}5. Certbot Zertifikat erneuern:${NC}"
echo "Führe Certbot Renewal aus..."

# Lade .env für Domain und Email
if [ -f ".env" ]; then
    source .env
    DOMAIN=${DOMAIN:-evidoxa.com}
    SSL_EMAIL=${SSL_EMAIL:-}
else
    DOMAIN="evidoxa.com"
    SSL_EMAIL=""
fi

# Erneuere Zertifikat (inkl. www Subdomain)
if [ -n "$SSL_EMAIL" ]; then
    echo "Erneuere Zertifikat für $DOMAIN und www.$DOMAIN..."
    
    docker run --rm \
        -v production_certbot-etc:/etc/letsencrypt \
        -v production_certbot-www:/var/www/certbot \
        certbot/certbot renew \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$SSL_EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        --force-renewal 2>&1 | tail -20
    
    RENEWAL_EXIT=$?
    
    if [ $RENEWAL_EXIT -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Zertifikat erfolgreich erneuert"
        
        # Nginx neu laden
        echo "Lade Nginx neu..."
        docker exec historian-nginx nginx -s reload 2>/dev/null && \
            echo -e "${GREEN}✓${NC} Nginx neu geladen" || \
            echo -e "${YELLOW}⚠${NC} Nginx Reload fehlgeschlagen, versuche Restart..."
            docker-compose -f docker-compose.production.yml restart nginx
    else
        echo -e "${YELLOW}⚠${NC} Zertifikat-Erneuerung hatte Probleme"
        echo "Versuche neue Zertifikatserstellung..."
        
        # Versuche neues Zertifikat zu erstellen
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
            -d "$DOMAIN" \
            -d "www.$DOMAIN" \
            --force-renewal 2>&1 | tail -20
    fi
else
    echo -e "${YELLOW}⚠${NC} SSL_EMAIL nicht in .env gefunden"
    echo "Bitte SSL_EMAIL in .env setzen"
fi
echo ""

# 6. Finaler Test
echo -e "${BLUE}6. Finaler SSL-Test:${NC}"
sleep 2

# Test mit openssl
SSL_VERIFY=$(echo | timeout 5 openssl s_client -connect evidoxa.com:443 -servername evidoxa.com 2>/dev/null | grep -E "Verify return code|CN=" | head -2 || echo "")
if [ -n "$SSL_VERIFY" ]; then
    echo "$SSL_VERIFY"
    if echo "$SSL_VERIFY" | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✓${NC} SSL-Zertifikat ist gültig!"
    else
        echo -e "${YELLOW}⚠${NC} SSL-Verifizierung hat Warnungen"
    fi
else
    echo -e "${YELLOW}⚠${NC} SSL-Test konnte nicht durchgeführt werden"
fi
echo ""

echo -e "${GREEN}=== SSL-PRÜFUNG ABGESCHLOSSEN ===${NC}"
echo ""
echo "Nächste Schritte:"
echo "1. Teste die Website im Browser: https://evidoxa.com"
echo "2. Prüfe ob die Warnung verschwunden ist"
echo "3. Falls immer noch Warnung: Prüfe Browser-Konsole für Details"
echo ""

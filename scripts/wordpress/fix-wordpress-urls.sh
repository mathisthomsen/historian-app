#!/bin/bash

# Fix WordPress URL Redirects

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== WORDPRESS URL FIX ===${NC}\n"

# Prüfe ob wp-cli verfügbar ist
if ! docker exec wordpress-app wp --info --allow-root >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} wp-cli nicht verfügbar, installiere..."
    docker exec wordpress-app sh -c 'curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && chmod +x wp-cli.phar && mv wp-cli.phar /usr/local/bin/wp' 2>/dev/null || echo "Installation fehlgeschlagen"
fi

echo -e "${BLUE}1. Aktuelle WordPress URLs:${NC}"
SITEURL=$(docker exec wordpress-app wp option get siteurl --allow-root 2>/dev/null || echo "")
HOMEURL=$(docker exec wordpress-app wp option get home --allow-root 2>/dev/null || echo "")

echo "Site URL: $SITEURL"
echo "Home URL: $HOMEURL"
echo ""

# Setze korrekte URLs
CORRECT_URL="https://bhgv.evidoxa.com"

if [ "$SITEURL" != "$CORRECT_URL" ] || [ "$HOMEURL" != "$CORRECT_URL" ]; then
    echo -e "${BLUE}2. Setze korrekte URLs:${NC}"
    docker exec wordpress-app wp option update siteurl "$CORRECT_URL" --allow-root 2>/dev/null && \
        echo -e "${GREEN}✓${NC} Site URL gesetzt: $CORRECT_URL" || \
        echo -e "${RED}✗${NC} Site URL konnte nicht gesetzt werden"
    
    docker exec wordpress-app wp option update home "$CORRECT_URL" --allow-root 2>/dev/null && \
        echo -e "${GREEN}✓${NC} Home URL gesetzt: $CORRECT_URL" || \
        echo -e "${RED}✗${NC} Home URL konnte nicht gesetzt werden"
else
    echo -e "${GREEN}✓${NC} URLs sind bereits korrekt"
fi
echo ""

# Prüfe wp-config.php
echo -e "${BLUE}3. Prüfe wp-config.php:${NC}"
if docker exec wordpress-app grep -q "WP_HOME\|WP_SITEURL" /var/www/html/wp-config.php 2>/dev/null; then
    echo "WP_HOME oder WP_SITEURL in wp-config.php gefunden"
    docker exec wordpress-app grep "WP_HOME\|WP_SITEURL" /var/www/html/wp-config.php
    echo ""
    echo -e "${YELLOW}⚠${NC} Falls Redirects weiterhin auftreten, prüfe diese Zeilen in wp-config.php"
else
    echo -e "${GREEN}✓${NC} Keine hardcoded URLs in wp-config.php"
fi
echo ""

echo -e "${GREEN}=== FERTIG ===${NC}"
echo ""
echo "Teste jetzt:"
echo "1. https://bhgv.evidoxa.com"
echo "2. https://bhgv.evidoxa.com/wp-admin/"
echo ""

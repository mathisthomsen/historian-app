#!/bin/bash

# Fix WordPress SSL Redirects

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== WORDPRESS SSL REDIRECT FIX ===${NC}\n"

WP_CONFIG="/var/www/html/wp-config.php"

# Prüfe ob FORCE_SSL_ADMIN bereits gesetzt ist
if docker exec wordpress-app grep -q "FORCE_SSL_ADMIN" "$WP_CONFIG" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} FORCE_SSL_ADMIN bereits in wp-config.php"
    docker exec wordpress-app grep "FORCE_SSL_ADMIN" "$WP_CONFIG"
else
    echo -e "${BLUE}Füge FORCE_SSL_ADMIN zu wp-config.php hinzu...${NC}"
    
    # Finde die Zeile vor "/* That's all, stop editing!" oder am Ende
    docker exec wordpress-app sh -c "
        if grep -q \"That's all, stop editing\" $WP_CONFIG; then
            sed -i \"/That's all, stop editing/i\\
define('FORCE_SSL_ADMIN', true);\\
if (isset(\$_SERVER['HTTP_X_FORWARDED_PROTO']) && \$_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {\\
    \$_SERVER['HTTPS'] = 'on';\\
}\\
\" $WP_CONFIG
        else
            echo \"define('FORCE_SSL_ADMIN', true);\" >> $WP_CONFIG
            echo \"if (isset(\$_SERVER['HTTP_X_FORWARDED_PROTO']) && \$_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') { \$_SERVER['HTTPS'] = 'on'; }\" >> $WP_CONFIG
        fi
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} FORCE_SSL_ADMIN hinzugefügt"
    else
        echo -e "${YELLOW}⚠${NC} Konnte FORCE_SSL_ADMIN nicht automatisch hinzufügen"
        echo "Füge manuell hinzu in wp-config.php:"
        echo "  define('FORCE_SSL_ADMIN', true);"
        echo "  if (isset(\$_SERVER['HTTP_X_FORWARDED_PROTO']) && \$_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {"
        echo "      \$_SERVER['HTTPS'] = 'on';"
        echo "  }"
    fi
fi
echo ""

# Prüfe Nginx Config für X-Forwarded-Proto
echo -e "${BLUE}2. Prüfe Nginx X-Forwarded-Proto:${NC}"
if docker exec historian-nginx grep -q "X-Forwarded-Proto" /etc/nginx/nginx.conf 2>/dev/null; then
    echo -e "${GREEN}✓${NC} X-Forwarded-Proto Header wird gesetzt"
else
    echo -e "${YELLOW}⚠${NC} X-Forwarded-Proto Header fehlt in Nginx Config"
    echo "Dies sollte in der FastCGI-Config vorhanden sein"
fi
echo ""

echo -e "${GREEN}=== FERTIG ===${NC}"
echo ""
echo "Teste jetzt:"
echo "1. https://bhgv.evidoxa.com"
echo "2. https://bhgv.evidoxa.com/wp-admin/"
echo ""
echo "Falls immer noch Probleme:"
echo "- Leere Browser-Cache"
echo "- Prüfe Browser-Konsole für Details"
echo ""

#!/bin/bash

# WordPress Theme Migration Script
# Migriert Theme von lokalem "Local" Setup zu Production

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== WORDPRESS THEME MIGRATION ===${NC}\n"

# Konfiguration
PROD_SERVER="root@217.154.198.215"
PROD_WP_PATH="/var/www/html"
THEME_NAME=""
LOCAL_THEME_PATH=""

# Parameter prüfen
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <local-theme-path> <theme-name>"
    echo ""
    echo "Beispiel:"
    echo "  $0 ~/LocalSites/mysite/app/public/wp-content/themes/my-theme my-theme"
    exit 1
fi

LOCAL_THEME_PATH="$1"
THEME_NAME="$2"

if [ ! -d "$LOCAL_THEME_PATH" ]; then
    echo -e "${RED}✗${NC} Theme-Verzeichnis nicht gefunden: $LOCAL_THEME_PATH"
    exit 1
fi

echo "Local Theme Path: $LOCAL_THEME_PATH"
echo "Theme Name: $THEME_NAME"
echo "Production Server: $PROD_SERVER"
echo ""

# 1. Theme ZIP erstellen
echo -e "${BLUE}1. Erstelle Theme ZIP...${NC}"
cd "$(dirname "$LOCAL_THEME_PATH")"
zip -r "/tmp/${THEME_NAME}.zip" "$(basename "$LOCAL_THEME_PATH")" -x "*.git/*" "*.DS_Store" "node_modules/*" ".env*"
echo -e "${GREEN}✓${NC} Theme ZIP erstellt: /tmp/${THEME_NAME}.zip"
echo ""

# 2. ZIP auf Server kopieren
echo -e "${BLUE}2. Kopiere Theme auf Server...${NC}"
scp "/tmp/${THEME_NAME}.zip" "$PROD_SERVER:/tmp/"
echo -e "${GREEN}✓${NC} Theme auf Server kopiert"
echo ""

# 3. Theme in WordPress Container installieren
echo -e "${BLUE}3. Installiere Theme im WordPress Container...${NC}"
ssh "$PROD_SERVER" << EOF
docker cp /tmp/${THEME_NAME}.zip wordpress-app:/tmp/
docker exec wordpress-app sh -c "cd /var/www/html/wp-content/themes && unzip -o /tmp/${THEME_NAME}.zip && rm /tmp/${THEME_NAME}.zip"
docker exec wordpress-app chown -R www-data:www-data /var/www/html/wp-content/themes/${THEME_NAME}
docker exec wordpress-app chmod -R 755 /var/www/html/wp-content/themes/${THEME_NAME}
EOF

echo -e "${GREEN}✓${NC} Theme installiert"
echo ""

# 4. Cleanup
rm "/tmp/${THEME_NAME}.zip"
ssh "$PROD_SERVER" "rm /tmp/${THEME_NAME}.zip"

echo -e "${GREEN}=== MIGRATION ABGESCHLOSSEN ===${NC}"
echo ""
echo "Nächste Schritte:"
echo "1. Öffne https://bhgv.evidoxa.com/wp-admin"
echo "2. Gehe zu Appearance → Themes"
echo "3. Aktiviere das Theme: $THEME_NAME"
echo ""

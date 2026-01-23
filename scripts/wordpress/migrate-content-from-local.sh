#!/bin/bash

# WordPress Content Migration Script
# Migriert Content von lokalem "Local" Setup zu Production

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== WORDPRESS CONTENT MIGRATION ===${NC}\n"

# Konfiguration
PROD_SERVER="root@217.154.198.215"
PROD_URL="https://bhgv.evidoxa.com"
LOCAL_URL=""
EXPORT_FILE=""

# Parameter prüfen
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <wordpress-export.xml> <local-url>"
    echo ""
    echo "Beispiel:"
    echo "  $0 wordpress-export.xml http://mysite.local"
    echo ""
    echo "Hinweis:"
    echo "  Exportiere zuerst Content aus lokalem WordPress:"
    echo "  Tools → Export → All content → Download Export File"
    exit 1
fi

EXPORT_FILE="$1"
LOCAL_URL="$2"

if [ ! -f "$EXPORT_FILE" ]; then
    echo -e "${RED}✗${NC} Export-Datei nicht gefunden: $EXPORT_FILE"
    exit 1
fi

echo "Export File: $EXPORT_FILE"
echo "Local URL: $LOCAL_URL"
echo "Production URL: $PROD_URL"
echo ""

# 1. Export-Datei auf Server kopieren
echo -e "${BLUE}1. Kopiere Export-Datei auf Server...${NC}"
scp "$EXPORT_FILE" "$PROD_SERVER:/tmp/wordpress-export.xml"
echo -e "${GREEN}✓${NC} Export-Datei kopiert"
echo ""

# 2. Import via WP-CLI (falls verfügbar)
echo -e "${BLUE}2. Importiere Content...${NC}"
echo -e "${YELLOW}⚠${NC} WP-CLI Import wird versucht..."
echo ""

# Prüfe ob WP-CLI verfügbar ist
if ssh "$PROD_SERVER" 'docker exec wordpress-app wp --info --allow-root >/dev/null 2>&1'; then
    echo "WP-CLI verfügbar, importiere..."
    ssh "$PROD_SERVER" << EOF
docker cp /tmp/wordpress-export.xml wordpress-app:/tmp/
docker exec wordpress-app wp import /tmp/wordpress-export.xml --allow-root --authors=create
EOF
    echo -e "${GREEN}✓${NC} Content importiert"
else
    echo -e "${YELLOW}⚠${NC} WP-CLI nicht verfügbar"
    echo "Bitte importiere manuell:"
    echo "1. Öffne https://bhgv.evidoxa.com/wp-admin"
    echo "2. Gehe zu Tools → Import → WordPress"
    echo "3. Installiere 'WordPress Importer' Plugin falls nötig"
    echo "4. Lade /tmp/wordpress-export.xml hoch"
fi
echo ""

# 3. URLs ersetzen
echo -e "${BLUE}3. Ersetze URLs in Datenbank...${NC}"
if ssh "$PROD_SERVER" 'docker exec wordpress-app wp --info --allow-root >/dev/null 2>&1'; then
    ssh "$PROD_SERVER" << EOF
docker exec wordpress-app wp search-replace '$LOCAL_URL' '$PROD_URL' --allow-root --all-tables
docker exec wordpress-app wp search-replace 'http://bhgv.evidoxa.com' 'https://bhgv.evidoxa.com' --allow-root --all-tables
EOF
    echo -e "${GREEN}✓${NC} URLs ersetzt"
else
    echo -e "${YELLOW}⚠${NC} URLs müssen manuell ersetzt werden"
    echo "Verwende Plugin 'Better Search Replace' oder 'Search Replace DB'"
fi
echo ""

# 4. Permalinks neu setzen
echo -e "${BLUE}4. Setze Permalinks neu...${NC}"
if ssh "$PROD_SERVER" 'docker exec wordpress-app wp --info --allow-root >/dev/null 2>&1'; then
    ssh "$PROD_SERVER" 'docker exec wordpress-app wp rewrite flush --allow-root'
    echo -e "${GREEN}✓${NC} Permalinks neu gesetzt"
else
    echo -e "${YELLOW}⚠${NC} Permalinks manuell setzen:"
    echo "Settings → Permalinks → Save Changes"
fi
echo ""

echo -e "${GREEN}=== CONTENT MIGRATION ABGESCHLOSSEN ===${NC}"
echo ""
echo "Nächste Schritte:"
echo "1. Prüfe https://bhgv.evidoxa.com"
echo "2. Prüfe alle Seiten und Posts"
echo "3. Prüfe ob Bilder korrekt angezeigt werden"
echo ""

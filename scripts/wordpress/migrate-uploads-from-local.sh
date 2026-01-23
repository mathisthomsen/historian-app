#!/bin/bash

# WordPress Uploads Migration Script
# Migriert Uploads/Medien von lokalem "Local" Setup zu Production

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== WORDPRESS UPLOADS MIGRATION ===${NC}\n"

# Konfiguration
PROD_SERVER="root@217.154.198.215"
LOCAL_UPLOADS_PATH=""

# Parameter prüfen
if [ -z "$1" ]; then
    echo "Usage: $0 <local-uploads-path>"
    echo ""
    echo "Beispiel:"
    echo "  $0 ~/LocalSites/mysite/app/public/wp-content/uploads"
    exit 1
fi

LOCAL_UPLOADS_PATH="$1"

if [ ! -d "$LOCAL_UPLOADS_PATH" ]; then
    echo -e "${RED}✗${NC} Uploads-Verzeichnis nicht gefunden: $LOCAL_UPLOADS_PATH"
    exit 1
fi

echo "Local Uploads Path: $LOCAL_UPLOADS_PATH"
echo "Production Server: $PROD_SERVER"
echo ""

# 1. Uploads komprimieren
echo -e "${BLUE}1. Komprimiere Uploads...${NC}"
cd "$(dirname "$LOCAL_UPLOADS_PATH")"
tar -czf "/tmp/uploads.tar.gz" "$(basename "$LOCAL_UPLOADS_PATH")"
UPLOADS_SIZE=$(du -h /tmp/uploads.tar.gz | cut -f1)
echo -e "${GREEN}✓${NC} Uploads komprimiert: $UPLOADS_SIZE"
echo ""

# 2. Uploads auf Server kopieren
echo -e "${BLUE}2. Kopiere Uploads auf Server...${NC}"
echo "Dies kann einige Minuten dauern, je nach Größe..."
scp "/tmp/uploads.tar.gz" "$PROD_SERVER:/tmp/"
echo -e "${GREEN}✓${NC} Uploads auf Server kopiert"
echo ""

# 3. Uploads in WordPress Container installieren
echo -e "${BLUE}3. Installiere Uploads im WordPress Container...${NC}"
ssh "$PROD_SERVER" << EOF
docker cp /tmp/uploads.tar.gz wordpress-app:/tmp/
docker exec wordpress-app sh -c "cd /var/www/html/wp-content && tar -xzf /tmp/uploads.tar.gz && rm /tmp/uploads.tar.gz"
docker exec wordpress-app chown -R www-data:www-data /var/www/html/wp-content/uploads
docker exec wordpress-app chmod -R 755 /var/www/html/wp-content/uploads
EOF

echo -e "${GREEN}✓${NC} Uploads installiert"
echo ""

# 4. Cleanup
rm "/tmp/uploads.tar.gz"
ssh "$PROD_SERVER" "rm /tmp/uploads.tar.gz"

echo -e "${GREEN}=== UPLOADS MIGRATION ABGESCHLOSSEN ===${NC}"
echo ""
echo "Nächste Schritte:"
echo "1. Prüfe https://bhgv.evidoxa.com"
echo "2. Prüfe ob Bilder korrekt angezeigt werden"
echo "3. Falls URLs noch falsch sind, verwende Search & Replace Plugin"
echo ""

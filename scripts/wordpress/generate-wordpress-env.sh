#!/bin/bash

# Generiert sichere Passwörter und erstellt .env für WordPress

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== WORDPRESS .ENV GENERATOR ===${NC}\n"

WORDPRESS_DIR="/opt/wordpress-client/production"

# Funktion zum Generieren von sicheren Passwörtern
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# 1. Prüfe ob .env bereits existiert
if [ -f "$WORDPRESS_DIR/.env" ]; then
    echo -e "${YELLOW}⚠${NC} .env existiert bereits in $WORDPRESS_DIR"
    read -p "Überschreiben? (j/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Jj]$ ]]; then
        echo "Abgebrochen."
        exit 0
    fi
fi

# 2. Generiere sichere Passwörter
echo -e "${BLUE}Generiere sichere Passwörter...${NC}"
MYSQL_PASSWORD=$(generate_password)
MYSQL_ROOT_PASSWORD=$(generate_password)

echo -e "${GREEN}✓${NC} Passwörter generiert"
echo ""

# 3. Erstelle .env Datei
echo -e "${BLUE}Erstelle .env Datei...${NC}"
mkdir -p "$WORDPRESS_DIR"

cat > "$WORDPRESS_DIR/.env" << EOF
# WordPress Environment Variables
# Generated: $(date)

# MySQL Configuration
MYSQL_DATABASE=wordpress
MYSQL_USER=wp_user
MYSQL_PASSWORD=$MYSQL_PASSWORD
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD

# WordPress Configuration
WORDPRESS_TABLE_PREFIX=wp_

# Domain
DOMAIN=bhgv.evidoxa.com
EOF

echo -e "${GREEN}✓${NC} .env Datei erstellt: $WORDPRESS_DIR/.env"
echo ""

# 4. Zeige Passwörter (nur einmal!)
echo -e "${YELLOW}=== WICHTIG: SPEICHERE DIESE PASSWÖRTER ===${NC}"
echo ""
echo "MySQL User Password (wp_user):"
echo "  $MYSQL_PASSWORD"
echo ""
echo "MySQL Root Password:"
echo "  $MYSQL_ROOT_PASSWORD"
echo ""
echo -e "${RED}⚠${NC} Diese Passwörter werden NUR EINMAL angezeigt!"
echo "   Speichere sie sicher (z.B. in einem Password Manager)"
echo ""

# 5. Setze sichere Berechtigungen
chmod 600 "$WORDPRESS_DIR/.env"
echo -e "${GREEN}✓${NC} Dateiberechtigungen gesetzt (600)"
echo ""

echo -e "${GREEN}=== FERTIG ===${NC}"
echo ""
echo "Nächste Schritte:"
echo "1. Prüfe .env: cat $WORDPRESS_DIR/.env"
echo "2. Starte WordPress: cd $WORDPRESS_DIR && docker-compose up -d"
echo ""

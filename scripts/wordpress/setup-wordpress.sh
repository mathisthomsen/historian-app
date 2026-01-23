#!/bin/bash

# WordPress Setup Script
# Erstellt die Verzeichnisstruktur und konfiguriert WordPress

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== WORDPRESS SETUP ===${NC}\n"

WORDPRESS_DIR="/opt/wordpress-client/production"

# 1. Verzeichnis erstellen
echo -e "${BLUE}1. Erstelle Verzeichnisstruktur:${NC}"
mkdir -p "$WORDPRESS_DIR"
cd "$WORDPRESS_DIR"
echo -e "${GREEN}✓${NC} Verzeichnis erstellt: $WORDPRESS_DIR"
echo ""

# 2. Docker Compose Datei kopieren
echo -e "${BLUE}2. Docker Compose Setup:${NC}"
if [ -f "/opt/historian-app/production/docker/wordpress/docker-compose.yml" ]; then
    cp /opt/historian-app/production/docker/wordpress/docker-compose.yml ./docker-compose.yml
    echo -e "${GREEN}✓${NC} docker-compose.yml kopiert"
else
    echo -e "${RED}✗${NC} docker-compose.yml nicht gefunden"
    exit 1
fi
echo ""

# 3. .env Datei erstellen
echo -e "${BLUE}3. Environment Variablen:${NC}"
if [ ! -f ".env" ]; then
    if [ -f "/opt/historian-app/production/docker/wordpress/env.example" ]; then
        cp /opt/historian-app/production/docker/wordpress/env.example .env
        echo -e "${GREEN}✓${NC} .env aus env.example erstellt"
        echo -e "${YELLOW}⚠${NC} WICHTIG: Bearbeite .env und setze sichere Passwörter!"
        echo "   nano $WORDPRESS_DIR/.env"
    else
        echo -e "${YELLOW}⚠${NC} env.example nicht gefunden, erstelle manuell .env"
    fi
else
    echo -e "${GREEN}✓${NC} .env existiert bereits"
fi
echo ""

# 4. WordPress Verzeichnisse erstellen
echo -e "${BLUE}4. WordPress Verzeichnisse:${NC}"
mkdir -p wordpress/wp-content
chmod -R 755 wordpress
echo -e "${GREEN}✓${NC} WordPress Verzeichnisse erstellt"
echo ""

# 5. Network erstellen (falls nicht existiert)
echo -e "${BLUE}5. Docker Network:${NC}"
if ! docker network ls | grep -q wordpress-network; then
    docker network create wordpress-network
    echo -e "${GREEN}✓${NC} wordpress-network erstellt"
else
    echo -e "${GREEN}✓${NC} wordpress-network existiert bereits"
fi
echo ""

echo -e "${GREEN}=== SETUP ABGESCHLOSSEN ===${NC}"
echo ""
echo "Nächste Schritte:"
echo "1. Bearbeite .env und setze sichere Passwörter:"
echo "   nano $WORDPRESS_DIR/.env"
echo ""
echo "2. Starte WordPress:"
echo "   cd $WORDPRESS_DIR"
echo "   docker-compose up -d"
echo ""
echo "3. Erstelle SSL-Zertifikat für bhgv.evidoxa.com"
echo "4. Teste: https://bhgv.evidoxa.com"
echo ""

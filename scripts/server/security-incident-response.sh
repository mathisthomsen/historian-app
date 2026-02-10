#!/bin/bash

# SOFORTMASSNAHME: Server wurde kompromittiert
# Dieses Script dokumentiert den Vorfall und stoppt verdächtige Prozesse

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${RED}=== KRITISCHER SICHERHEITSVORFALL ===${NC}"
echo -e "${RED}Server wurde kompromittiert!${NC}\n"

cd /opt/historian-app/production

# 1. Verdächtige Prozesse identifizieren
echo -e "${BLUE}1. Verdächtige Prozesse:${NC}"
docker exec historian-app ps aux | grep -E "vim|wget|curl|bash|sh.*http" | grep -v grep || echo "Keine verdächtigen Prozesse gefunden"
echo ""

# 2. Verdächtige Dateien suchen
echo -e "${BLUE}2. Verdächtige Dateien im Container:${NC}"
docker exec historian-app find /tmp /var/tmp -type f -mtime -7 2>/dev/null | head -20
echo ""

# 3. Netzwerk-Verbindungen prüfen
echo -e "${BLUE}3. Aktive Netzwerk-Verbindungen:${NC}"
docker exec historian-app netstat -tuln 2>/dev/null | grep -v "127.0.0.1\|0.0.0.0:3000" || docker exec historian-app ss -tuln 2>/dev/null | grep -v "127.0.0.1\|0.0.0.0:3000"
echo ""

# 4. Cron Jobs prüfen
echo -e "${BLUE}4. Cron Jobs:${NC}"
docker exec historian-app crontab -l 2>/dev/null || echo "Keine Cron Jobs"
echo ""

echo -e "${YELLOW}=== SOFORTMASSNAHME ===${NC}"
echo "1. Container SOFORT stoppen"
echo "2. Container neu bauen (ohne Cache)"
echo "3. Alle Passwörter ändern"
echo "4. SSH Keys prüfen"
echo "5. Firewall Regeln prüfen"
echo ""

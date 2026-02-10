#!/bin/bash

# Schnelle 504 Diagnose - fokussiert auf die wichtigsten Logs

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${RED}=== QUICK 504 CHECK ===${NC}\n"

cd /opt/historian-app/production

echo -e "${BLUE}1. App Logs (letzte 30 Zeilen - DAS IST WICHTIG!):${NC}"
docker logs historian-app --tail 30 2>&1
echo ""

echo -e "${BLUE}2. Nginx Error Logs (letzte 20 Zeilen):${NC}"
docker exec historian-nginx tail -20 /var/log/nginx/error.log 2>/dev/null || tail -20 logs/nginx/error.log 2>/dev/null || echo "Konnte Error Log nicht lesen"
echo ""

echo -e "${BLUE}3. App Prozesse:${NC}"
docker exec historian-app ps aux 2>/dev/null | head -5
echo ""

echo -e "${BLUE}4. Test ob App-Dateien existieren:${NC}"
docker exec historian-app ls -la /app/server.js 2>/dev/null && echo -e "${GREEN}✓ server.js gefunden${NC}" || echo -e "${RED}✗ server.js NICHT gefunden${NC}"
docker exec historian-app ls -la /app/.next 2>/dev/null && echo -e "${GREEN}✓ .next Verzeichnis gefunden${NC}" || echo -e "${RED}✗ .next Verzeichnis NICHT gefunden${NC}"
echo ""

echo -e "${YELLOW}=== NÄCHSTE SCHRITTE ===${NC}"
echo "Basierend auf den Logs oben:"
echo "- Wenn 'Error', 'Cannot connect', 'ECONNREFUSED' → Database Problem"
echo "- Wenn 'server.js not found' → App nicht gebaut"
echo "- Wenn 'EADDRINUSE' → Port bereits belegt"
echo "- Wenn Nginx 'upstream timeout' → App antwortet nicht"
echo ""

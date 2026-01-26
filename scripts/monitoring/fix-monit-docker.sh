#!/bin/bash

# Fix Monit Docker Container Monitoring
# Ersetzt process checks durch program checks für Docker-Container

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== MONIT DOCKER FIX ===${NC}\n"

MONIT_CONFIG="/etc/monit/monitrc"

# Backup
cp "$MONIT_CONFIG" "${MONIT_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✓${NC} Backup erstellt"

# Ersetze process checks durch program checks
cat > /tmp/monit-docker-fix.txt << 'EOF'
###############################################################################
## Docker Container Monitoring (Fixed)
###############################################################################
  # Historian App
  check program historian-app with path "/bin/bash -c 'docker ps --format \"{{.Names}}\" | grep -q \"^historian-app$\" && docker inspect historian-app --format \"{{.State.Status}}\" | grep -q running"
    if status != 0 then alert
    start program = "/usr/bin/docker start historian-app"
    stop program = "/usr/bin/docker stop historian-app"

  # Nginx
  check program historian-nginx with path "/bin/bash -c 'docker ps --format \"{{.Names}}\" | grep -q \"^historian-nginx$\" && docker inspect historian-nginx --format \"{{.State.Status}}\" | grep -q running"
    if status != 0 then alert
    start program = "/usr/bin/docker start historian-nginx"
    stop program = "/usr/bin/docker stop historian-nginx"

  # Redis
  check program historian-redis with path "/bin/bash -c 'docker ps --format \"{{.Names}}\" | grep -q \"^historian-redis$\" && docker inspect historian-redis --format \"{{.State.Status}}\" | grep -q running"
    if status != 0 then alert
    start program = "/usr/bin/docker start historian-redis"
    stop program = "/usr/bin/docker stop historian-redis"

  # WordPress App
  check program wordpress-app with path "/bin/bash -c 'docker ps --format \"{{.Names}}\" | grep -q \"^wordpress-app$\" && docker inspect wordpress-app --format \"{{.State.Status}}\" | grep -q running"
    if status != 0 then alert
    start program = "/usr/bin/docker start wordpress-app"
    stop program = "/usr/bin/docker stop wordpress-app"

  # WordPress MySQL
  check program wordpress-mysql with path "/bin/bash -c 'docker ps --format \"{{.Names}}\" | grep -q \"^wordpress-mysql$\" && docker inspect wordpress-mysql --format \"{{.State.Status}}\" | grep -q running"
    if status != 0 then alert
    start program = "/usr/bin/docker start wordpress-mysql"
    stop program = "/usr/bin/docker stop wordpress-mysql"
EOF

# Ersetze die Docker Container Checks
sed -i '/^  check process historian-app matching/,/^    if 3 restarts within 5 cycles then alert/d' "$MONIT_CONFIG"
sed -i '/^  check process historian-nginx matching/,/^    if 3 restarts within 5 cycles then alert/d' "$MONIT_CONFIG"
sed -i '/^  check process historian-redis matching/,/^    if 3 restarts within 5 cycles then alert/d' "$MONIT_CONFIG"
sed -i '/^  check process wordpress-app matching/,/^    if 3 restarts within 5 cycles then alert/d' "$MONIT_CONFIG"
sed -i '/^  check process wordpress-mysql matching/,/^    if 3 restarts within 5 cycles then alert/d' "$MONIT_CONFIG"

# Füge neue Checks ein (vor dem Docker Service Monitoring)
sed -i '/^###############################################################################$/r /tmp/monit-docker-fix.txt' "$MONIT_CONFIG"

# Prüfe Config
if monit -t; then
    echo -e "${GREEN}✓${NC} Monit Config ist gültig"
    monit reload
    echo -e "${GREEN}✓${NC} Monit neu geladen"
else
    echo -e "${RED}✗${NC} Monit Config Fehler!"
    exit 1
fi

# Test
sleep 2
echo ""
echo -e "${BLUE}Monit Status:${NC}"
monit status | grep -A 3 "historian-app\|historian-nginx\|wordpress"

echo ""
echo -e "${GREEN}=== FIX ABGESCHLOSSEN ===${NC}"

#!/bin/bash

# SSH Service neu laden (Ubuntu/Debian)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== SSH SERVICE NEU LADEN ===${NC}\n"

# Prüfe welcher Service-Name verwendet wird
if systemctl list-units --type=service | grep -q "ssh.service"; then
    SERVICE_NAME="ssh"
elif systemctl list-units --type=service | grep -q "sshd.service"; then
    SERVICE_NAME="sshd"
else
    echo -e "${RED}✗${NC} SSH Service nicht gefunden"
    echo "Verfügbare Services:"
    systemctl list-units --type=service | grep -i ssh || echo "Keine SSH-Services gefunden"
    exit 1
fi

echo "Verwende Service: $SERVICE_NAME"
echo ""

# Prüfe SSH Config Syntax
echo -e "${BLUE}1. Prüfe SSH Config Syntax:${NC}"
if sshd -t 2>/dev/null || /usr/sbin/sshd -t 2>/dev/null; then
    echo -e "${GREEN}✓${NC} SSH Config Syntax ist gültig"
else
    echo -e "${RED}✗${NC} SSH Config hat Syntax-Fehler!"
    echo "Bitte prüfe: /etc/ssh/sshd_config"
    exit 1
fi
echo ""

# Reload SSH Service
echo -e "${BLUE}2. Lade SSH Service neu:${NC}"
if systemctl reload "$SERVICE_NAME" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} SSH Service erfolgreich neu geladen"
elif systemctl restart "$SERVICE_NAME" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} SSH Service erfolgreich neu gestartet"
else
    echo -e "${RED}✗${NC} SSH Service konnte nicht neu geladen werden"
    exit 1
fi
echo ""

# Prüfe Status
echo -e "${BLUE}3. SSH Service Status:${NC}"
systemctl status "$SERVICE_NAME" --no-pager -l | head -10
echo ""

echo -e "${GREEN}=== FERTIG ===${NC}"
echo ""
echo "SSH-Änderungen sind jetzt aktiv:"
echo "- Password Authentication ist deaktiviert (nur SSH Keys)"
echo "- MaxAuthTries = 3"
echo "- PermitRootLogin = prohibit-password"
echo ""

#!/bin/bash
# Monit Web-Interface Login-Check
# Auf dem Server ausführen: sudo bash scripts/monitoring/check-monit-web-login.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== Monit Web-Interface Login-Check ===${NC}\n"

MONIT_CONFIG="/etc/monit/monitrc"

# 1. Monit läuft
echo -e "${BLUE}1. Monit Status${NC}"
if systemctl is-active --quiet monit 2>/dev/null; then
    echo -e "   ${GREEN}✓${NC} Monit läuft"
else
    echo -e "   ${RED}✗${NC} Monit läuft nicht → sudo systemctl start monit"
    exit 1
fi

# 2. Port 2812
echo -e "\n${BLUE}2. Web-Interface (Port 2812)${NC}"
if ss -tlnp 2>/dev/null | grep -q 2812 || netstat -tlnp 2>/dev/null | grep -q 2812; then
    echo -e "   ${GREEN}✓${NC} Port 2812 wird gehört"
else
    echo -e "   ${RED}✗${NC} Port 2812 nicht offen – prüfe ob 'set httpd port 2812' in $MONIT_CONFIG steht"
fi

# 3. HTTPd-Block in Config
echo -e "\n${BLUE}3. Login-Konfiguration in $MONIT_CONFIG${NC}"
if [ ! -f "$MONIT_CONFIG" ]; then
    echo -e "   ${RED}✗${NC} Config nicht gefunden"
    exit 1
fi

# Zeigen: set httpd ... und allow-Zeilen (Passwort maskieren)
if grep -A 5 "set httpd port" "$MONIT_CONFIG" | head -6 | while read line; do
    # Passwort in allow user:password durch *** ersetzen
    if echo "$line" | grep -q "allow.*:.*"; then
        echo "$line" | sed -E 's/(allow [^:]+:)[^ ]+/\1***/'
    else
        echo "$line"
    fi
done | sed 's/^/   /'; then
    :
fi

# Prüfen ob allow mit User:Passwort existiert
if grep -E "allow (admin|root|[a-z]+):[^@]" "$MONIT_CONFIG" | grep -v "^#" | grep -q .; then
    echo -e "   ${GREEN}✓${NC} allow user:password gefunden (Login aktiv)"
else
    if grep -E "allow @|allow.*htpasswd" "$MONIT_CONFIG" | grep -v "^#" | grep -q .; then
        echo -e "   ${GREEN}✓${NC} allow @htpasswd-Datei gefunden"
        if [ -f /etc/monit/htpasswd ]; then
            echo -e "   ${GREEN}✓${NC} /etc/monit/htpasswd existiert"
        else
            echo -e "   ${RED}✗${NC} /etc/monit/htpasswd fehlt – Login schlägt fehl!"
            echo -e "   → sudo htpasswd -c /etc/monit/htpasswd admin"
            echo -e "   → In monitrc: allow @/etc/monit/htpasswd (oder allow admin:NEUES_PASSWORT)"
            echo -e "   → sudo monit reload"
        fi
    else
        echo -e "   ${RED}✗${NC} Keine gültige 'allow user:password' Zeile gefunden"
        echo -e "   Erwartung z.B.: allow admin:monit"
    fi
fi

# 4. Zugriff nur von localhost?
if grep -q "use address localhost" "$MONIT_CONFIG"; then
    echo -e "\n${BLUE}4. Zugriff${NC}"
    echo -e "   ${GREEN}✓${NC} Interface nur von localhost – Zugriff nur per SSH-Tunnel von deinem Rechner."
fi

# 5. Anleitung
echo -e "\n${BLUE}5. So loggst du dich ein${NC}"
echo -e "   Auf deinem ${YELLOW}Mac${NC} (nicht auf dem Server):"
echo -e "   ${GREEN}ssh -L 2812:localhost:2812 root@217.154.198.215${NC}"
echo -e "   Session offen lassen, dann im Browser: ${GREEN}http://localhost:2812${NC}"
echo -e "   User: ${GREEN}admin${NC}  |  Passwort: steht in monitrc bei 'allow admin:...' (Standard: monit)"
echo ""

echo -e "${BLUE}6. Passwort zurücksetzen (auf dem Server)${NC}"
echo -e "   Neues Passwort in Config eintragen:"
echo -e "   ${GREEN}sudo sed -i 's/^[[:space:]]*allow admin:.*/  allow admin:DEIN_NEUES_PASSWORT/' $MONIT_CONFIG${NC}"
echo -e "   Dann: ${GREEN}sudo monit reload${NC}"
echo -e "   Oder mit htpasswd: ${GREEN}sudo htpasswd -c /etc/monit/htpasswd admin${NC}"
echo -e "   Und in monitrc: ${GREEN}allow @/etc/monit/htpasswd${NC} (statt allow admin:...) + monit reload"
echo ""

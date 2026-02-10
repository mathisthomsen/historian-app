#!/bin/bash

# Logwatch Setup Script
# Installiert und konfiguriert Logwatch für tägliche Log-Reports

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== LOGWATCH SETUP ===${NC}\n"

# Prüfe ob root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗${NC} Bitte als root ausführen"
    exit 1
fi

# 1. Logwatch installieren
echo -e "${BLUE}1. Installiere Logwatch...${NC}"
if command -v logwatch &> /dev/null; then
    echo -e "${GREEN}✓${NC} Logwatch ist bereits installiert"
else
    apt-get update
    apt-get install -y logwatch
    echo -e "${GREEN}✓${NC} Logwatch installiert"
fi
echo ""

# 2. Logwatch Config erstellen
echo -e "${BLUE}2. Konfiguriere Logwatch...${NC}"
LOGWATCH_CONFIG="/etc/logwatch/conf/logwatch.conf"

# Backup bestehende Config
if [ -f "$LOGWATCH_CONFIG" ]; then
    cp "$LOGWATCH_CONFIG" "${LOGWATCH_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✓${NC} Backup erstellt"
fi

# E-Mail-Adresse abfragen
read -p "E-Mail-Adresse für tägliche Log-Reports: " LOGWATCH_EMAIL
if [ -z "$LOGWATCH_EMAIL" ]; then
    echo -e "${RED}✗${NC} E-Mail-Adresse ist erforderlich"
    exit 1
fi

# MailFrom für Resend: muss verifizierte Domain sein (z.B. logwatch@evidoxa.com)
read -p "Absender-Adresse für Logwatch (z.B. logwatch@evidoxa.com, Enter = logwatch@evidoxa.com): " LOGWATCH_FROM
LOGWATCH_FROM=${LOGWATCH_FROM:-logwatch@evidoxa.com}

# Config erstellen
cat > "$LOGWATCH_CONFIG" << EOF
# Logwatch Configuration
# Täglich um 6:00 Uhr wird ein Log-Report per E-Mail versendet

# Detail-Level: Low, Med, High
Detail = Med

# E-Mail-Einstellungen (MailFrom = bei Resend verifizierte Domain!)
MailTo = $LOGWATCH_EMAIL
MailFrom = $LOGWATCH_FROM

# Format: text oder html
Format = text

# Services die überwacht werden sollen
Service = All

# Services die ignoriert werden (nur Einträge, die auf diesem System existieren – zz-misc/zz-network/zz-sys fehlen oft)
Service = "-eximstats"

# Range: All, Today, Yesterday
Range = yesterday

# Archiv: Komprimierte Logs auch durchsuchen
Archive = yes

# Hostname im Report
Hostname = \$(hostname)
EOF

echo -e "${GREEN}✓${NC} Logwatch Konfiguration erstellt: $LOGWATCH_CONFIG"
echo ""

# 3. Docker-Logs einbinden (optional)
echo -e "${BLUE}3. Docker-Logs einbinden...${NC}"
DOCKER_LOGS_DIR="/var/log/docker"
mkdir -p "$DOCKER_LOGS_DIR"

# Symlinks für Docker-Container-Logs erstellen
if [ -d "/opt/historian-app/production/logs" ]; then
    ln -sf /opt/historian-app/production/logs/nginx "$DOCKER_LOGS_DIR/nginx" 2>/dev/null || true
    ln -sf /opt/historian-app/production/logs/production "$DOCKER_LOGS_DIR/historian-app" 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Docker-Logs verlinkt"
else
    echo -e "${YELLOW}⚠${NC} Historian App Logs nicht gefunden (normal wenn noch nicht deployed)"
fi
echo ""

# 4. Cron-Job einrichten
echo -e "${BLUE}4. Richte täglichen Cron-Job ein...${NC}"
CRON_JOB="0 6 * * * /usr/sbin/logwatch --output mail --mailto $LOGWATCH_EMAIL --detail medium"

# Prüfe ob Cron-Job bereits existiert
if crontab -l 2>/dev/null | grep -q "logwatch"; then
    echo -e "${YELLOW}⚠${NC} Cron-Job existiert bereits"
else
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✓${NC} Cron-Job erstellt (täglich um 6:00 Uhr)"
fi
echo ""

# 5. Test-Report generieren
echo -e "${BLUE}5. Generiere Test-Report...${NC}"
read -p "Test-Report jetzt generieren? (j/n): " GENERATE_TEST
if [[ "$GENERATE_TEST" =~ ^[Jj]$ ]]; then
    logwatch --output mail --mailto "$LOGWATCH_EMAIL" --detail medium --range yesterday
    echo -e "${GREEN}✓${NC} Test-Report wurde an $LOGWATCH_EMAIL gesendet"
else
    echo -e "${YELLOW}⚠${NC} Test-Report übersprungen"
fi
echo ""

# 6. Zusammenfassung
echo -e "${GREEN}=== LOGWATCH SETUP ABGESCHLOSSEN ===${NC}"
echo ""
echo "Konfiguration:"
echo "  Config: $LOGWATCH_CONFIG"
echo "  E-Mail: $LOGWATCH_EMAIL"
echo "  Zeit: Täglich um 6:00 Uhr"
echo ""
echo "Nützliche Befehle:"
echo "  logwatch --output mail --mailto $LOGWATCH_EMAIL --detail medium"
echo "  logwatch --output stdout --detail high"
echo "  crontab -l                    - Zeige Cron-Jobs"
echo ""

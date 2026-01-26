#!/bin/bash

# Monit Telegram Alert Setup
# Konfiguriert Monit für Telegram-Alerts via Webhook

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== MONIT TELEGRAM ALERT SETUP ===${NC}\n"

# Prüfe ob root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗${NC} Bitte als root ausführen"
    exit 1
fi

# 1. Telegram Bot Token und Chat ID abfragen
echo -e "${BLUE}1. Telegram Konfiguration:${NC}"
read -p "Telegram Bot Token: " TELEGRAM_BOT_TOKEN
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo -e "${RED}✗${NC} Bot Token ist erforderlich"
    exit 1
fi

read -p "Telegram Chat ID: " TELEGRAM_CHAT_ID
if [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo -e "${RED}✗${NC} Chat ID ist erforderlich"
    exit 1
fi
echo ""

# 2. Telegram Alert Script erstellen
echo -e "${BLUE}2. Erstelle Telegram Alert Script...${NC}"
TELEGRAM_SCRIPT="/usr/local/bin/monit-telegram-alert.sh"

cat > "$TELEGRAM_SCRIPT" << EOF
#!/bin/bash
# Monit Telegram Alert Script

BOT_TOKEN="$TELEGRAM_BOT_TOKEN"
CHAT_ID="$TELEGRAM_CHAT_ID"

# Monit Event-Variablen
SERVICE="\$MONIT_SERVICE"
EVENT="\$MONIT_EVENT"
DESCRIPTION="\$MONIT_DESCRIPTION"
DATE="\$(date '+%Y-%m-%d %H:%M:%S')"
HOST="\$(hostname)"

# Telegram Message
MESSAGE="🚨 *Monit Alert*
*Service:* \$SERVICE
*Event:* \$EVENT
*Host:* \$HOST
*Date:* \$DATE

*Description:*
\$DESCRIPTION"

# Sende an Telegram
curl -s -X POST "https://api.telegram.org/bot\${BOT_TOKEN}/sendMessage" \\
    -d chat_id="\${CHAT_ID}" \\
    -d text="\${MESSAGE}" \\
    -d parse_mode="Markdown" \\
    > /dev/null
EOF

chmod +x "$TELEGRAM_SCRIPT"
echo -e "${GREEN}✓${NC} Telegram Script erstellt: $TELEGRAM_SCRIPT"
echo ""

# 3. Monit Config erweitern
echo -e "${BLUE}3. Erweitere Monit Config...${NC}"
MONIT_CONFIG="/etc/monit/monitrc"

# Prüfe ob Telegram-Config bereits existiert
if grep -q "monit-telegram-alert.sh" "$MONIT_CONFIG"; then
    echo -e "${YELLOW}⚠${NC} Telegram-Config existiert bereits"
else
    # Backup
    cp "$MONIT_CONFIG" "${MONIT_CONFIG}.backup.telegram.$(date +%Y%m%d_%H%M%S)"
    
    # Füge Alert-Handler hinzu (vor dem ersten "check" Statement)
    sed -i '/^check system/a \
  # Telegram Alert Handler\
  set alert sysadmin@localhost not {instance}\
  set alert sysadmin@localhost {exec "/usr/local/bin/monit-telegram-alert.sh"} if {instance}' "$MONIT_CONFIG"
    
    echo -e "${GREEN}✓${NC} Monit Config erweitert"
fi
echo ""

# 4. Test-Alert senden
echo -e "${BLUE}4. Teste Telegram Alert...${NC}"
read -p "Test-Alert jetzt senden? (j/n): " SEND_TEST
if [[ "$SEND_TEST" =~ ^[Jj]$ ]]; then
    export MONIT_SERVICE="Test"
    export MONIT_EVENT="Test Alert"
    export MONIT_DESCRIPTION="Dies ist ein Test-Alert von Monit"
    "$TELEGRAM_SCRIPT"
    echo -e "${GREEN}✓${NC} Test-Alert gesendet. Prüfe Telegram!"
else
    echo -e "${YELLOW}⚠${NC} Test übersprungen"
fi
echo ""

# 5. Monit neu laden
echo -e "${BLUE}5. Lade Monit neu...${NC}"
monit reload
echo -e "${GREEN}✓${NC} Monit neu geladen"
echo ""

# 6. Zusammenfassung
echo -e "${GREEN}=== TELEGRAM ALERT SETUP ABGESCHLOSSEN ===${NC}"
echo ""
echo "Konfiguration:"
echo "  Script: $TELEGRAM_SCRIPT"
echo "  Bot Token: ${TELEGRAM_BOT_TOKEN:0:10}..."
echo "  Chat ID: $TELEGRAM_CHAT_ID"
echo ""
echo "Hinweis:"
echo "  Telegram-Alerts werden zusätzlich zu E-Mail-Alerts gesendet"
echo "  Test-Alert manuell senden:"
echo "    MONIT_SERVICE='Test' MONIT_EVENT='Test' MONIT_DESCRIPTION='Test' $TELEGRAM_SCRIPT"
echo ""

#!/bin/bash
# Logwatch + Resend Diagnose-Check
# Auf dem Server ausführen: sudo bash scripts/monitoring/check-logwatch-resend.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== Logwatch + Resend Diagnose ===${NC}\n"

ERRORS=0

# 1. Postfix läuft
echo -e "${BLUE}1. Postfix Status${NC}"
if systemctl is-active --quiet postfix; then
    echo -e "   ${GREEN}✓${NC} Postfix läuft"
else
    echo -e "   ${RED}✗${NC} Postfix läuft NICHT → sudo systemctl start postfix"
    ((ERRORS++))
fi

# 2. Relayhost + SASL
echo -e "\n${BLUE}2. Postfix Resend-Konfiguration${NC}"
RELAY=$(postconf -h relayhost 2>/dev/null || true)
if [[ "$RELAY" == *"smtp.resend.com"* ]]; then
    echo -e "   ${GREEN}✓${NC} relayhost = $RELAY"
else
    echo -e "   ${RED}✗${NC} relayhost nicht auf Resend gesetzt (aktuell: ${RELAY:-nicht gesetzt})"
    echo -e "   → Siehe docs/development/LOGWATCH_RESEND_SETUP.md"
    ((ERRORS++))
fi

SASL=$(postconf -h smtp_sasl_auth_enable 2>/dev/null || true)
if [[ "$SASL" == "yes" ]]; then
    echo -e "   ${GREEN}✓${NC} smtp_sasl_auth_enable = yes"
else
    echo -e "   ${RED}✗${NC} smtp_sasl_auth_enable = $SASL (sollte yes sein)"
    ((ERRORS++))
fi

if [ -f /etc/postfix/sasl_passwd ]; then
    echo -e "   ${GREEN}✓${NC} /etc/postfix/sasl_passwd existiert"
    if [ -f /etc/postfix/sasl_passwd.db ]; then
        echo -e "   ${GREEN}✓${NC} postmap wurde ausgeführt (sasl_passwd.db vorhanden)"
    else
        echo -e "   ${RED}✗${NC} postmap noch nicht ausgeführt → sudo postmap /etc/postfix/sasl_passwd"
        ((ERRORS++))
    fi
else
    echo -e "   ${RED}✗${NC} /etc/postfix/sasl_passwd fehlt (Resend API Key eintragen)"
    ((ERRORS++))
fi

# 3. From-Adresse (Generic Maps) – wichtig für Resend!
echo -e "\n${BLUE}3. From-Adresse / Generic Maps (wichtig für Resend)${NC}"
HOSTNAME=$(hostname)
if postconf -h smtp_generic_maps 2>/dev/null | grep -q "generic"; then
    echo -e "   ${GREEN}✓${NC} smtp_generic_maps ist gesetzt"
    if [ -f /etc/postfix/generic ]; then
        echo -e "   Inhalt von /etc/postfix/generic:"
        sed 's/^/   /' /etc/postfix/generic
        if grep -q "evidoxa.com" /etc/postfix/generic 2>/dev/null; then
            echo -e "   ${GREEN}✓${NC} Verifizierte Domain (evidoxa.com) wird verwendet"
        else
            echo -e "   ${YELLOW}⚠${NC} Stelle sicher, dass rechts eine bei Resend verifizierte Adresse steht (z.B. logwatch@evidoxa.com)"
        fi
        # Prüfen ob aktueller Hostname gemappt ist
        if grep -q "root@${HOSTNAME}" /etc/postfix/generic 2>/dev/null; then
            echo -e "   ${GREEN}✓${NC} root@${HOSTNAME} wird gemappt"
        else
            echo -e "   ${YELLOW}⚠${NC} Eintrag für root@${HOSTNAME} fehlt – Resend lehnt sonst ab!"
            echo -e "   → echo 'root@${HOSTNAME} logwatch@evidoxa.com' | sudo tee -a /etc/postfix/generic"
            echo -e "   → sudo postmap /etc/postfix/generic && sudo systemctl restart postfix"
        fi
    fi
else
    echo -e "   ${RED}✗${NC} smtp_generic_maps nicht gesetzt – Resend lehnt root@${HOSTNAME} ab!"
    echo -e "   Führe aus:"
    echo -e "   echo 'root@${HOSTNAME} logwatch@evidoxa.com' | sudo tee /etc/postfix/generic"
    echo -e "   sudo postmap /etc/postfix/generic"
    echo -e "   sudo postconf -e 'smtp_generic_maps = hash:/etc/postfix/generic'"
    echo -e "   sudo systemctl restart postfix"
    ((ERRORS++))
fi

# 4. Logwatch Config – MailFrom muss verifizierte Domain sein
echo -e "\n${BLUE}4. Logwatch Konfiguration${NC}"
LOGWATCH_CONF="/etc/logwatch/conf/logwatch.conf"
if [ -f "$LOGWATCH_CONF" ]; then
    MAIL_FROM=$(grep -E "^MailFrom\s*=" "$LOGWATCH_CONF" 2>/dev/null | sed 's/.*=\s*//;s/^ *//' || true)
    MAIL_TO=$(grep -E "^MailTo\s*=" "$LOGWATCH_CONF" 2>/dev/null | sed 's/.*=\s*//;s/^ *//' || true)
    if [[ "$MAIL_FROM" == *"evidoxa.com"* ]]; then
        echo -e "   ${GREEN}✓${NC} MailFrom = $MAIL_FROM (verifizierte Domain)"
    else
        echo -e "   ${RED}✗${NC} MailFrom = ${MAIL_FROM:-nicht gesetzt} – muss verifizierte Domain sein (z.B. logwatch@evidoxa.com)"
        echo -e "   → sudo sed -i 's|^MailFrom.*|MailFrom = logwatch@evidoxa.com|' $LOGWATCH_CONF"
        ((ERRORS++))
    fi
    echo -e "   MailTo = ${MAIL_TO:-nicht gesetzt}"
else
    echo -e "   ${YELLOW}⚠${NC} $LOGWATCH_CONF nicht gefunden (Logwatch evtl. nicht installiert)"
fi

# 5. Cron
echo -e "\n${BLUE}5. Logwatch Cron-Job${NC}"
if crontab -l 2>/dev/null | grep -q logwatch; then
    echo -e "   ${GREEN}✓${NC} Logwatch im Crontab:"
    crontab -l 2>/dev/null | grep logwatch | sed 's/^/   /'
else
    echo -e "   ${RED}✗${NC} Kein Logwatch-Eintrag in crontab -l"
    echo -e "   → crontab -e und z.B. hinzufügen: 0 6 * * * /usr/sbin/logwatch --output mail --mailto DEINE@EMAIL.com --detail medium"
    ((ERRORS++))
fi

# 6. Mail-Logs (wo schaut Postfix hin?)
echo -e "\n${BLUE}6. Letzte Postfix-/Mail-Aktivität${NC}"
for LOG in /var/log/postfix.log /var/log/mail.log; do
    if [ -f "$LOG" ]; then
        echo -e "   Letzte Zeilen aus $LOG:"
        tail -5 "$LOG" 2>/dev/null | sed 's/^/   /'
        break
    fi
done
if [ ! -f /var/log/postfix.log ] && [ ! -f /var/log/mail.log ]; then
    echo -e "   ${YELLOW}⚠${NC} Weder /var/log/postfix.log noch /var/log/mail.log gefunden"
fi

# 7. Test-Mail vorschlagen
echo -e "\n${BLUE}7. Manueller Test${NC}"
echo -e "   Test-Mail senden (ersetze DEINE@EMAIL.com):"
echo -e "   ${GREEN}echo \"Test Logwatch\" | mail -s \"Logwatch Test $(date +%Y-%m-%d)\" DEINE@EMAIL.com${NC}"
echo -e "   Dann: tail -f /var/log/postfix.log  oder  tail -f /var/log/mail.log"
echo -e "   In Resend Dashboard: Logs prüfen – erscheint die Mail?"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}=== $ERRORS Problem(e) gefunden – siehe Hinweise oben ===${NC}"
    echo -e "Dokumentation: docs/development/LOGWATCH_RESEND_TROUBLESHOOTING.md"
    exit 1
else
    echo -e "${GREEN}=== Konfiguration sieht gut aus ===${NC}"
    echo -e "Falls trotzdem keine Mails ankommen: Test-Mail senden und Postfix-Logs + Resend Logs prüfen."
    exit 0
fi

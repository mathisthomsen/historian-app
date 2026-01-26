#!/bin/bash

# Monit Setup Script
# Installiert und konfiguriert Monit für Server-Monitoring

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== MONIT SETUP ===${NC}\n"

# Prüfe ob root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗${NC} Bitte als root ausführen"
    exit 1
fi

# 1. Monit installieren
echo -e "${BLUE}1. Installiere Monit...${NC}"
if command -v monit &> /dev/null; then
    echo -e "${GREEN}✓${NC} Monit ist bereits installiert"
else
    apt-get update
    apt-get install -y monit
    echo -e "${GREEN}✓${NC} Monit installiert"
fi
echo ""

# 2. Monit Config erstellen
echo -e "${BLUE}2. Erstelle Monit Konfiguration...${NC}"
MONIT_CONFIG="/etc/monit/monitrc"

# Backup bestehende Config
if [ -f "$MONIT_CONFIG" ]; then
    cp "$MONIT_CONFIG" "${MONIT_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✓${NC} Backup erstellt"
fi

# Basis-Config
cat > "$MONIT_CONFIG" << 'EOF'
###############################################################################
## Monit control file
###############################################################################
##
## Comments begin with a '#' and extend through the end of the line. Keywords
## are case insensitive. All path's MUST BE FULLY QUALIFIED, starting with '/'.
##
## Below you will find examples of various frequently used statement types.
## For information about the control file, a complete list of statements and
## their options, please have a look in the Monit manual.
##
## https://mmonit.com/monit/documentation/monit.html
##
###############################################################################
## Global section
###############################################################################
#
  set daemon 60              # Check services at 60 seconds intervals
  set logfile /var/log/monit.log
  set idfile /var/lib/monit/id
  set statefile /var/lib/monit/state

###############################################################################
## Mail settings
###############################################################################
#
  set mailserver localhost
  set mail-format {
    from: monit@$HOST
    subject: $SERVICE $EVENT at $DATE
    message: $EVENT Service $SERVICE
              Date:        $DATE
              Action:      $ACTION
              Host:        $HOST
              Description: $DESCRIPTION

              Your faithful employee,
              Monit
  }
  set alert root@localhost

###############################################################################
## Web interface
###############################################################################
#
  set httpd port 2812 and
      use address localhost  # only accept connection from localhost
      allow localhost        # allow localhost to connect to the server and
      allow admin:monit      # require user 'admin' with password 'monit'

###############################################################################
## System monitoring
###############################################################################
#
  check system $HOST
    if loadavg (1min) > 4 then alert
    if loadavg (5min) > 2 then alert
    if memory usage > 80% then alert
    if swap usage > 20% then alert
    if cpu usage (user) > 80% then alert
    if cpu usage (system) > 80% then alert

###############################################################################
## Filesystem monitoring
###############################################################################
#
  check filesystem rootfs with path /
    if space usage > 80% then alert
    if inode usage > 80% then alert

  check filesystem disk with path /opt
    if space usage > 85% then alert
    if inode usage > 80% then alert

###############################################################################
## Docker Container Monitoring
###############################################################################
#
  # Historian App
  check process historian-app matching "historian-app"
    start program = "/usr/bin/docker start historian-app"
    stop program = "/usr/bin/docker stop historian-app"
    if failed port 3000 protocol http
      with timeout 10 seconds
      for 2 cycles
    then restart
    if 3 restarts within 5 cycles then alert

  # Nginx
  check process historian-nginx matching "historian-nginx"
    start program = "/usr/bin/docker start historian-nginx"
    stop program = "/usr/bin/docker stop historian-nginx"
    if failed port 80 protocol http
      with timeout 5 seconds
      for 2 cycles
    then restart
    if 3 restarts within 5 cycles then alert

  # Redis
  check process historian-redis matching "historian-redis"
    start program = "/usr/bin/docker start historian-redis"
    stop program = "/usr/bin/docker stop historian-redis"
    if failed port 6379 protocol redis
      with timeout 5 seconds
      for 2 cycles
    then restart
    if 3 restarts within 5 cycles then alert

  # WordPress App
  check process wordpress-app matching "wordpress-app"
    start program = "/usr/bin/docker start wordpress-app"
    stop program = "/usr/bin/docker stop wordpress-app"
    if 3 restarts within 5 cycles then alert

  # WordPress MySQL
  check process wordpress-mysql matching "wordpress-mysql"
    start program = "/usr/bin/docker start wordpress-mysql"
    stop program = "/usr/bin/docker stop wordpress-mysql"
    if failed port 3306 protocol mysql
      with timeout 5 seconds
      for 2 cycles
    then restart
    if 3 restarts within 5 cycles then alert

###############################################################################
## Docker Service Monitoring
###############################################################################
#
  check program docker with path "/bin/bash -c 'if ! docker ps > /dev/null 2>&1; then exit 1; fi'"
    if status != 0 then alert

EOF

chmod 600 "$MONIT_CONFIG"
echo -e "${GREEN}✓${NC} Monit Konfiguration erstellt: $MONIT_CONFIG"
echo ""

# 3. E-Mail-Konfiguration abfragen
echo -e "${BLUE}3. E-Mail-Konfiguration:${NC}"
read -p "E-Mail-Adresse für Alerts (Enter für root@localhost): " ALERT_EMAIL
ALERT_EMAIL=${ALERT_EMAIL:-root@localhost}

# E-Mail in Config setzen
sed -i "s|set alert root@localhost|set alert $ALERT_EMAIL|" "$MONIT_CONFIG"
echo -e "${GREEN}✓${NC} Alert-E-Mail gesetzt: $ALERT_EMAIL"
echo ""

# 4. Monit starten
echo -e "${BLUE}4. Starte Monit...${NC}"
systemctl enable monit
systemctl restart monit

# Prüfe Status
sleep 2
if systemctl is-active --quiet monit; then
    echo -e "${GREEN}✓${NC} Monit läuft"
else
    echo -e "${RED}✗${NC} Monit konnte nicht gestartet werden"
    systemctl status monit
    exit 1
fi
echo ""

# 5. Web-Interface Passwort setzen
echo -e "${BLUE}5. Web-Interface Passwort:${NC}"
read -p "Passwort für Monit Web-Interface (Enter für 'monit'): " MONIT_PASSWORD
MONIT_PASSWORD=${MONIT_PASSWORD:-monit}

# Passwort in Config setzen (wird von htpasswd generiert, hier vereinfacht)
echo -e "${YELLOW}⚠${NC} Web-Interface Passwort manuell setzen:"
echo "   sudo htpasswd -c /etc/monit/htpasswd admin"
echo "   Oder in /etc/monit/monitrc ändern: allow admin:$MONIT_PASSWORD"
echo ""

# 6. Zusammenfassung
echo -e "${GREEN}=== MONIT SETUP ABGESCHLOSSEN ===${NC}"
echo ""
echo "Monit Status:"
monit status
echo ""
echo "Web-Interface: http://localhost:2812 (nur lokal)"
echo "Logs: /var/log/monit.log"
echo "Config: $MONIT_CONFIG"
echo ""
echo "Nützliche Befehle:"
echo "  monit status          - Status aller Services"
echo "  monit summary         - Zusammenfassung"
echo "  monit reload          - Config neu laden"
echo "  systemctl status monit - Systemd Status"
echo ""

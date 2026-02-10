#!/bin/bash

# Umfassendes Security Hardening nach Sicherheitsvorfall

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== UMFASSENDES SECURITY HARDENING ===${NC}\n"

# 1. Fail2ban installieren und konfigurieren
echo -e "${BLUE}1. Fail2ban Setup:${NC}"
if ! command -v fail2ban-client &> /dev/null; then
    echo "Installiere fail2ban..."
    apt-get update -qq
    apt-get install -y fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
    echo -e "${GREEN}✓${NC} Fail2ban installiert"
else
    echo -e "${GREEN}✓${NC} Fail2ban bereits installiert"
fi

# Fail2ban SSH Jail konfigurieren
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 7200
findtime = 600
maxretry = 3
destemail = root@localhost
sendername = Fail2Ban
action = %(action_)s

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
maxretry = 3
bantime = 7200
findtime = 600
EOF

systemctl restart fail2ban
echo -e "${GREEN}✓${NC} Fail2ban konfiguriert (3 Fehlversuche = 2h Ban)"
echo "Aktuell gebannte IPs:"
fail2ban-client status sshd 2>/dev/null | grep "Banned IP" || echo "Keine gebannten IPs"
echo ""

# 2. Firewall härten
echo -e "${BLUE}2. Firewall Setup:${NC}"
if command -v ufw &> /dev/null; then
    # Erlaube nur notwendige Ports
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    ufw --force reload
    echo -e "${GREEN}✓${NC} Firewall konfiguriert"
    echo "Status:"
    ufw status numbered
else
    echo -e "${YELLOW}⚠${NC} UFW nicht installiert, installiere..."
    apt-get update -qq
    apt-get install -y ufw
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo -e "${GREEN}✓${NC} UFW installiert und konfiguriert"
fi
echo ""

# 3. SSH Hardening
echo -e "${BLUE}3. SSH Hardening:${NC}"
SSH_CONFIG="/etc/ssh/sshd_config"
if [ -f "$SSH_CONFIG" ]; then
    # Backup erstellen
    if [ ! -f "$SSH_CONFIG.backup.$(date +%Y%m%d)" ]; then
        cp "$SSH_CONFIG" "$SSH_CONFIG.backup.$(date +%Y%m%d)"
        echo -e "${GREEN}✓${NC} Backup erstellt"
    fi
    
    # Wichtige Einstellungen setzen
    sed -i 's/#PermitRootLogin.*/PermitRootLogin prohibit-password/' "$SSH_CONFIG"
    sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/' "$SSH_CONFIG"
    
    # Password Authentication deaktivieren (nur wenn SSH Keys vorhanden)
    if [ -f ~/.ssh/authorized_keys ] && [ -s ~/.ssh/authorized_keys ]; then
        sed -i 's/#PasswordAuthentication.*/PasswordAuthentication no/' "$SSH_CONFIG"
        sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' "$SSH_CONFIG"
        echo -e "${GREEN}✓${NC} Password Authentication deaktiviert (SSH Keys vorhanden)"
    else
        echo -e "${YELLOW}⚠${NC} SSH Keys nicht gefunden, Password Authentication bleibt aktiv"
        echo "   Erstelle SSH Keys und deaktiviere dann Passwords manuell"
    fi
    
    # Weitere Hardening-Einstellungen
    sed -i 's/#PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSH_CONFIG"
    sed -i 's/#MaxAuthTries.*/MaxAuthTries 3/' "$SSH_CONFIG"
    sed -i 's/#ClientAliveInterval.*/ClientAliveInterval 300/' "$SSH_CONFIG"
    sed -i 's/#ClientAliveCountMax.*/ClientAliveCountMax 2/' "$SSH_CONFIG"
    
    # Prüfe ob Änderungen nötig sind
    if ! grep -q "^PermitRootLogin prohibit-password" "$SSH_CONFIG"; then
        if ! grep -q "^PermitRootLogin" "$SSH_CONFIG"; then
            echo "PermitRootLogin prohibit-password" >> "$SSH_CONFIG"
        fi
    fi
    
    echo -e "${GREEN}✓${NC} SSH Config aktualisiert"
    echo ""
    echo -e "${YELLOW}⚠${NC} WICHTIG: Teste SSH-Verbindung in neuem Terminal bevor du sshd neu startest!"
    echo "   Zum Aktivieren: systemctl restart sshd"
    echo "   Oder: systemctl reload sshd"
else
    echo -e "${YELLOW}⚠${NC} SSH Config nicht gefunden"
fi
echo ""

# 4. Docker Security
echo -e "${BLUE}4. Docker Security Check:${NC}"
echo "Container Status:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
echo ""

# Prüfe auf root-Container
ROOT_CONTAINERS=$(docker ps --format "{{.Names}}" | while read name; do
    USER=$(docker inspect "$name" --format '{{.Config.User}}' 2>/dev/null || echo "root")
    if [ -z "$USER" ] || [ "$USER" = "root" ]; then
        echo "$name"
    fi
done)

if [ -n "$ROOT_CONTAINERS" ]; then
    echo -e "${YELLOW}⚠${NC} Container die als root laufen:"
    echo "$ROOT_CONTAINERS" | sed 's/^/  - /'
else
    echo -e "${GREEN}✓${NC} Alle Container laufen als non-root User"
fi
echo ""

# 5. Log Rotation
echo -e "${BLUE}5. Log Rotation:${NC}"
if [ ! -f "/etc/logrotate.d/docker-containers" ]; then
    cat > /etc/logrotate.d/docker-containers << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=10M
    missingok
    delaycompress
    copytruncate
}
EOF
    echo -e "${GREEN}✓${NC} Log Rotation konfiguriert"
else
    echo -e "${GREEN}✓${NC} Log Rotation bereits konfiguriert"
fi

# App-spezifische Log Rotation
if [ -d "/opt/historian-app/production/logs" ]; then
    cat > /etc/logrotate.d/historian-app << 'EOF'
/opt/historian-app/production/logs/**/*.log {
    rotate 14
    daily
    compress
    size=50M
    missingok
    delaycompress
    copytruncate
}
EOF
    echo -e "${GREEN}✓${NC} App Log Rotation konfiguriert"
fi
echo ""

# 6. System Updates
echo -e "${BLUE}6. System Updates:${NC}"
echo "Prüfe verfügbare Updates..."
UPDATES=$(apt list --upgradable 2>/dev/null | grep -c upgradable || echo "0")
if [ "$UPDATES" -gt 1 ]; then
    echo -e "${YELLOW}⚠${NC} $UPDATES Pakete können aktualisiert werden"
    echo "Führe aus: apt-get update && apt-get upgrade -y"
else
    echo -e "${GREEN}✓${NC} System ist auf dem neuesten Stand"
fi
echo ""

# 7. Unattended Upgrades (automatische Security Updates)
echo -e "${BLUE}7. Automatische Security Updates:${NC}"
if ! dpkg -l | grep -q unattended-upgrades; then
    echo "Installiere unattended-upgrades..."
    apt-get update -qq
    apt-get install -y unattended-upgrades
    echo -e "${GREEN}✓${NC} unattended-upgrades installiert"
else
    echo -e "${GREEN}✓${NC} unattended-upgrades bereits installiert"
fi

# Konfiguriere automatische Updates
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

echo 'APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";' > /etc/apt/apt.conf.d/20auto-upgrades

echo -e "${GREEN}✓${NC} Automatische Security Updates konfiguriert"
echo ""

# 8. Docker Logging Limit
echo -e "${BLUE}8. Docker Logging Limit:${NC}"
if [ ! -f "/etc/docker/daemon.json" ]; then
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
    echo -e "${GREEN}✓${NC} Docker Logging Limit konfiguriert"
    echo -e "${YELLOW}⚠${NC} Docker muss neu gestartet werden: systemctl restart docker"
else
    echo -e "${GREEN}✓${NC} Docker daemon.json bereits vorhanden"
fi
echo ""

# 9. SSH Key Check
echo -e "${BLUE}9. SSH Keys prüfen:${NC}"
if [ -f ~/.ssh/authorized_keys ] && [ -s ~/.ssh/authorized_keys ]; then
    KEY_COUNT=$(wc -l < ~/.ssh/authorized_keys)
    echo -e "${GREEN}✓${NC} $KEY_COUNT SSH Key(s) gefunden"
    echo "Stelle sicher, dass nur vertrauenswürdige Keys vorhanden sind!"
else
    echo -e "${RED}✗${NC} Keine SSH Keys gefunden"
    echo "Erstelle SSH Keys bevor du Password Authentication deaktivierst!"
fi
echo ""

# 10. Zusammenfassung
echo -e "${GREEN}=== SECURITY HARDENING ABGESCHLOSSEN ===${NC}"
echo ""
echo "Durchgeführte Maßnahmen:"
echo "  ✓ Fail2ban installiert und konfiguriert"
echo "  ✓ Firewall (UFW) konfiguriert"
echo "  ✓ SSH Hardening konfiguriert"
echo "  ✓ Log Rotation eingerichtet"
echo "  ✓ Automatische Security Updates konfiguriert"
echo "  ✓ Docker Logging Limits gesetzt"
echo ""
echo -e "${YELLOW}NÄCHSTE SCHRITTE (manuell):${NC}"
echo "1. Teste SSH-Verbindung in neuem Terminal"
echo "2. Falls OK: systemctl restart sshd (oder reload)"
echo "3. System Updates: apt-get update && apt-get upgrade -y"
echo "4. Docker neu starten (falls daemon.json geändert): systemctl restart docker"
echo "5. Prüfe Fail2ban Status: fail2ban-client status sshd"
echo ""
echo -e "${BLUE}WICHTIGE HINWEISE:${NC}"
echo "- SSH Password Authentication wurde deaktiviert (wenn Keys vorhanden)"
echo "- Teste SSH-Zugriff bevor du den Server verlierst!"
echo "- Fail2ban bannt IPs nach 3 fehlgeschlagenen Login-Versuchen für 2 Stunden"
echo "- Firewall erlaubt nur Port 22 (SSH), 80 (HTTP), 443 (HTTPS)"
echo ""

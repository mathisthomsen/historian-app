#!/bin/bash

# Security Hardening nach Sicherheitsvorfall

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}=== SECURITY HARDENING ===${NC}\n"

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
bantime = 3600
findtime = 600
maxretry = 5
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
EOF

systemctl restart fail2ban
echo -e "${GREEN}✓${NC} Fail2ban konfiguriert (3 Fehlversuche = 2h Ban)"
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
    ufw status verbose
else
    echo -e "${YELLOW}⚠${NC} UFW nicht installiert"
fi
echo ""

# 3. SSH Hardening
echo -e "${BLUE}3. SSH Hardening:${NC}"
SSH_CONFIG="/etc/ssh/sshd_config"
if [ -f "$SSH_CONFIG" ]; then
    # Backup erstellen
    cp "$SSH_CONFIG" "$SSH_CONFIG.backup.$(date +%Y%m%d)"
    
    # Wichtige Einstellungen setzen
    sed -i 's/#PermitRootLogin.*/PermitRootLogin prohibit-password/' "$SSH_CONFIG"
    sed -i 's/#PasswordAuthentication.*/PasswordAuthentication no/' "$SSH_CONFIG"
    sed -i 's/#PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSH_CONFIG"
    sed -i 's/#MaxAuthTries.*/MaxAuthTries 3/' "$SSH_CONFIG"
    
    # Prüfe ob Änderungen nötig sind
    if ! grep -q "PermitRootLogin prohibit-password" "$SSH_CONFIG"; then
        echo "PermitRootLogin prohibit-password" >> "$SSH_CONFIG"
    fi
    
    echo -e "${GREEN}✓${NC} SSH Config aktualisiert"
    echo "WICHTIG: Teste SSH-Verbindung bevor du sshd neu startest!"
    echo "Zum Aktivieren: systemctl restart sshd"
else
    echo -e "${YELLOW}⚠${NC} SSH Config nicht gefunden"
fi
echo ""

# 4. Docker Security
echo -e "${BLUE}4. Docker Security Check:${NC}"
echo "Prüfe Container Security..."
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
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
echo ""

# 6. System Updates
echo -e "${BLUE}6. System Updates:${NC}"
echo "Führe aus: apt-get update && apt-get upgrade -y"
echo ""

echo -e "${GREEN}=== HARDENING ABGESCHLOSSEN ===${NC}"
echo ""
echo "Nächste Schritte:"
echo "1. SSH-Verbindung testen (in neuem Terminal)"
echo "2. Falls OK: systemctl restart sshd"
echo "3. System Updates: apt-get update && apt-get upgrade -y"
echo "4. App testen: curl https://evidoxa.com"
echo ""

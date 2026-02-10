#!/bin/bash

# Historian App - Server Setup Script
# For Ubuntu 24.04 LTS VPS

set -e

echo "🚀 Starting Historian App server setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Docker
print_status "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
print_status "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application user
print_status "Creating application user..."
useradd -m -s /bin/bash historian
usermod -aG docker historian

# Configure firewall (UFW)
print_status "Configuring firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 22

# Install and configure fail2ban
print_status "Installing fail2ban..."
apt install -y fail2ban

# Create fail2ban configuration
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF

# Restart fail2ban
systemctl restart fail2ban
systemctl enable fail2ban

# Configure system limits
print_status "Configuring system limits..."
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF

# Configure sysctl for better performance
cat >> /etc/sysctl.conf << EOF
# Network optimization
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq

# File descriptor limits
fs.file-max = 2097152
EOF

# Apply sysctl changes
sysctl -p

# Configure log rotation
print_status "Configuring log rotation..."
cat > /etc/logrotate.d/historian-app << EOF
/opt/historian-app/logs/*/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 historian historian
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF

# Create application directories
print_status "Creating application directories..."
mkdir -p /opt/historian-app/logs/{production,nginx}
mkdir -p /opt/historian-app/backups
chown -R historian:historian /opt/historian-app

# Install monitoring tools
print_status "Installing monitoring tools..."
apt install -y htop iotop nethogs

# Create monitoring script
cat > /opt/historian-app/monitor.sh << 'EOF'
#!/bin/bash
LOG_FILE="/opt/historian-app/logs/system-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Get system stats
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
DOCKER_CONTAINERS=$(docker ps --format "table {{.Names}}\t{{.Status}}" | wc -l)

# Log the stats
echo "$DATE - CPU: ${CPU_USAGE}% | Memory: ${MEMORY_USAGE}% | Disk: ${DISK_USAGE}% | Containers: $((DOCKER_CONTAINERS - 1))" >> $LOG_FILE

# Alert if usage is high
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "$DATE - WARNING: High CPU usage: ${CPU_USAGE}%" >> $LOG_FILE
fi

if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "$DATE - WARNING: High memory usage: ${MEMORY_USAGE}%" >> $LOG_FILE
fi

if [ "$DISK_USAGE" -gt 80 ]; then
    echo "$DATE - WARNING: High disk usage: ${DISK_USAGE}%" >> $LOG_FILE
fi
EOF

chmod +x /opt/historian-app/monitor.sh
chown historian:historian /opt/historian-app/monitor.sh

# Create backup script
cat > /opt/historian-app/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/historian-app/backups"
DATE=$(date '+%Y%m%d_%H%M%S')

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /opt historian-app --exclude=historian-app/logs --exclude=historian-app/backups

# Backup Docker volumes (if any)
docker run --rm -v historian-app_data:/data -v $BACKUP_DIR:/backup alpine tar -czf /backup/volumes_backup_$DATE.tar.gz -C /data .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/historian-app/backup.sh
chown historian:historian /opt/historian-app/backup.sh

# Set up cron jobs
print_status "Setting up cron jobs..."
(crontab -u historian -l 2>/dev/null; echo "*/5 * * * * /opt/historian-app/monitor.sh") | crontab -u historian -
(crontab -u historian -l 2>/dev/null; echo "0 2 * * * /opt/historian-app/backup.sh") | crontab -u historian -

# Create SSL renewal script
cat > /opt/historian-app/renew-ssl.sh << 'EOF'
#!/bin/bash
cd /opt/historian-app
docker-compose -f docker-compose.production.yml exec nginx certbot renew --quiet
docker-compose -f docker-compose.production.yml restart nginx
EOF

chmod +x /opt/historian-app/renew-ssl.sh
chown historian:historian /opt/historian-app/renew-ssl.sh

# Add SSL renewal to cron
(crontab -u historian -l 2>/dev/null; echo "0 12 * * * /opt/historian-app/renew-ssl.sh") | crontab -u historian -

print_status "Server setup completed successfully!"
print_status "Next steps:"
echo "1. Switch to historian user: su - historian"
echo "2. Clone the repository: cd /opt && git clone https://github.com/mathisthomsen/historian-app.git historian-app"
echo "3. Configure environment variables"
echo "4. Deploy the application"

print_warning "Remember to:"
echo "- Configure your domain DNS to point to this server"
echo "- Update environment variables with your real values"
echo "- Set up SSL certificates after deployment"

print_status "Setup completed! 🎉" 
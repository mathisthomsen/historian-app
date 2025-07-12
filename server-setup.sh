#!/bin/bash

# Server Setup Script for Historian App VPS
# This script should be run on a fresh Ubuntu 24.04 LTS server
# Usage: ./server-setup.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
}

# Function to update system
update_system() {
    print_status "Updating system packages..."
    apt update && apt upgrade -y
    print_status "System updated successfully"
}

# Function to install essential packages
install_essential_packages() {
    print_status "Installing essential packages..."
    apt install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        htop \
        nano \
        vim \
        ufw \
        fail2ban \
        logrotate \
        nginx \
        certbot \
        python3-certbot-nginx
    print_status "Essential packages installed"
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # Reset firewall
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable firewall
    ufw --force enable
    
    print_status "Firewall configured successfully"
}

# Function to configure fail2ban
configure_fail2ban() {
    print_status "Configuring fail2ban..."
    
    # Create fail2ban configuration
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https"]
logpath = /var/log/nginx/access.log
maxretry = 3
EOF
    
    # Restart fail2ban
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    print_status "Fail2ban configured successfully"
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Remove old versions
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Add Docker GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index
    apt update
    
    # Install Docker
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    usermod -aG docker $SUDO_USER
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    print_status "Docker installed successfully"
}

# Function to install Docker Compose
install_docker_compose() {
    print_status "Installing Docker Compose..."
    
    # Install Docker Compose v2 (included with Docker)
    # For standalone installation, uncomment the following:
    # curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    # chmod +x /usr/local/bin/docker-compose
    
    print_status "Docker Compose is included with Docker installation"
}

# Function to configure system limits
configure_system_limits() {
    print_status "Configuring system limits..."
    
    # Increase file descriptor limits
    cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
EOF
    
    # Configure sysctl for better performance
    cat >> /etc/sysctl.conf << EOF
# Increase file descriptor limits
fs.file-max = 65536

# Network settings
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 400000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65000

# Memory settings
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF
    
    # Apply sysctl changes
    sysctl -p
    
    print_status "System limits configured"
}

# Function to configure log rotation
configure_log_rotation() {
    print_status "Configuring log rotation..."
    
    # Create logrotate configuration for application logs
    cat > /etc/logrotate.d/historian-app << EOF
/var/log/historian-app/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF
    
    print_status "Log rotation configured"
}

# Function to create application user
create_app_user() {
    print_status "Creating application user..."
    
    # Create historian user
    useradd -m -s /bin/bash historian || true
    
    # Create application directory
    mkdir -p /opt/historian-app
    chown historian:historian /opt/historian-app
    
    print_status "Application user created"
}

# Function to configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."
    
    # Stop and disable default nginx
    systemctl stop nginx
    systemctl disable nginx
    
    # Remove default nginx configuration
    rm -f /etc/nginx/sites-enabled/default
    rm -f /etc/nginx/sites-available/default
    
    print_status "Nginx configured for Docker deployment"
}

# Function to configure SSL renewal
configure_ssl_renewal() {
    print_status "Configuring SSL certificate renewal..."
    
    # Create SSL renewal script
    cat > /opt/historian-app/renew-ssl.sh << 'EOF'
#!/bin/bash
cd /opt/historian-app
docker-compose -f docker-compose.production.yml run --rm certbot renew
docker-compose -f docker-compose.production.yml restart nginx
EOF
    
    chmod +x /opt/historian-app/renew-ssl.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 12 * * * /opt/historian-app/renew-ssl.sh") | crontab -
    
    print_status "SSL renewal configured"
}

# Function to create backup script
create_backup_script() {
    print_status "Creating backup script..."
    
    cat > /opt/historian-app/backup.sh << 'EOF'
#!/bin/bash
cd /opt/historian-app
./deploy-production.sh backup
EOF
    
    chmod +x /opt/historian-app/backup.sh
    
    # Add to crontab (daily backup at 2 AM)
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/historian-app/backup.sh") | crontab -
    
    print_status "Backup script created"
}

# Function to configure monitoring
configure_monitoring() {
    print_status "Configuring basic monitoring..."
    
    # Create monitoring script
    cat > /opt/historian-app/monitor.sh << 'EOF'
#!/bin/bash
cd /opt/historian-app

# Check disk usage
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage is ${DISK_USAGE}%" | logger
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ $MEM_USAGE -gt 80 ]; then
    echo "WARNING: Memory usage is ${MEM_USAGE}%" | logger
fi

# Check if containers are running
if ! docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    echo "ERROR: Some containers are not running" | logger
fi
EOF
    
    chmod +x /opt/historian-app/monitor.sh
    
    # Add to crontab (check every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/historian-app/monitor.sh") | crontab -
    
    print_status "Monitoring configured"
}

# Function to display final instructions
display_final_instructions() {
    print_status "Server setup completed successfully!"
    echo ""
    print_info "Next steps:"
    echo "1. Switch to the historian user: su - historian"
    echo "2. Clone your repository: git clone <your-repo-url> /opt/historian-app"
    echo "3. Copy env.production.example to .env.production and configure it"
    echo "4. Run: ./deploy-production.sh up"
    echo "5. Setup SSL: ./deploy-production.sh ssl"
    echo ""
    print_info "Useful commands:"
    echo "- View logs: ./deploy-production.sh logs"
    echo "- Check status: ./deploy-production.sh status"
    echo "- Backup database: ./deploy-production.sh backup"
    echo "- Monitor resources: ./deploy-production.sh monitor"
    echo ""
    print_warning "Remember to:"
    echo "- Configure your domain DNS to point to this server"
    echo "- Set up proper environment variables in .env.production"
    echo "- Test the application thoroughly before going live"
}

# Main function
main() {
    print_status "🚀 Historian App Server Setup"
    print_status "============================="
    
    # Check if running as root
    check_root
    
    # Update system
    update_system
    
    # Install essential packages
    install_essential_packages
    
    # Configure firewall
    configure_firewall
    
    # Configure fail2ban
    configure_fail2ban
    
    # Install Docker
    install_docker
    
    # Install Docker Compose
    install_docker_compose
    
    # Configure system limits
    configure_system_limits
    
    # Configure log rotation
    configure_log_rotation
    
    # Create application user
    create_app_user
    
    # Configure Nginx
    configure_nginx
    
    # Configure SSL renewal
    configure_ssl_renewal
    
    # Create backup script
    create_backup_script
    
    # Configure monitoring
    configure_monitoring
    
    # Display final instructions
    display_final_instructions
}

# Run main function
main 
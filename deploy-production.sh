#!/bin/bash

# Historian App - Production Deployment Script

set -e

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

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    echo "Please copy env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Function to check if containers are running
check_containers() {
    if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
        return 0
    else
        return 1
    fi
}

# Function to show usage
usage() {
    echo "Usage: $0 {up|down|restart|status|logs|ssl|renew|backup|monitor|update}"
    echo ""
    echo "Commands:"
    echo "  up      - Start all services"
    echo "  down    - Stop all services"
    echo "  restart - Restart all services"
    echo "  status  - Show service status"
    echo "  logs    - Show logs (all services)"
    echo "  ssl     - Set up SSL certificates"
    echo "  renew   - Renew SSL certificates"
    echo "  backup  - Create database backup"
    echo "  monitor - Show system resources"
    echo "  update  - Update application from git"
}

# Function to start services
start_services() {
    print_status "Starting Historian App services..."
    
    # Create necessary directories
    mkdir -p logs/{production,nginx,strapi}
    mkdir -p ssl
    mkdir -p certbot/{conf,www}
    
    # Run Prisma migrations before starting services
    print_status "Running Prisma migrations (npx prisma migrate deploy)..."
    docker-compose -f docker-compose.production.yml --env-file .env run --rm app npx prisma migrate deploy
    print_status "Prisma migrations completed."
    # Start services
    docker-compose -f docker-compose.production.yml --env-file .env up -d
    
    print_status "Services started successfully!"
    print_status "Application will be available at: https://$DOMAIN"
    print_status "Strapi admin at: https://$DOMAIN/admin"
    print_status "Health check at: https://$DOMAIN/health"
}

# Function to stop services
stop_services() {
    print_status "Stopping Historian App services..."
    docker-compose -f docker-compose.production.yml down
    print_status "Services stopped successfully!"
}

# Function to restart services
restart_services() {
    print_status "Restarting Historian App services..."
    docker-compose -f docker-compose.production.yml restart
    print_status "Services restarted successfully!"
}

# Function to show status
show_status() {
    print_status "Service Status:"
    docker-compose -f docker-compose.production.yml ps
    
    echo ""
    print_status "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Function to show logs
show_logs() {
    if [ -z "$1" ]; then
        print_status "Showing logs for all services..."
        docker-compose -f docker-compose.production.yml logs -f
    else
        print_status "Showing logs for $1..."
        docker-compose -f docker-compose.production.yml logs -f "$1"
    fi
}

# Function to set up SSL
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    # Check if domain is configured
    if [ -z "$DOMAIN" ]; then
        print_error "DOMAIN not configured in .env"
        exit 1
    fi
    
    # Check if SSL_EMAIL is configured
    if [ -z "$SSL_EMAIL" ]; then
        print_error "SSL_EMAIL not configured in .env"
        exit 1
    fi
    
    # Create necessary directories
    mkdir -p certbot/{conf,www}
    mkdir -p certbot/www/.well-known/acme-challenge
    
    # Ensure nginx is running before certbot
    print_status "Ensuring nginx is running for ACME challenge..."
    docker-compose -f docker-compose.production.yml up -d nginx

    # Wait for nginx to be ready
    print_status "Waiting for nginx to be ready..."
    sleep 5

    # Check if nginx is serving HTTP
    for i in {1..10}; do
        if curl -s "http://localhost/.well-known/acme-challenge/test" || curl -s "http://127.0.0.1/.well-known/acme-challenge/test"; then
            print_status "nginx is up and serving HTTP."
            break
        else
            print_status "Waiting for nginx to serve HTTP (attempt $i)..."
            sleep 2
        fi
    done

    # Run certbot to get certificates for main domain
    print_status "Requesting SSL certificate for $DOMAIN..."
    docker-compose -f docker-compose.production.yml --env-file .env run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$SSL_EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        -d "$DOMAIN"
    
    # If staging domain is configured, get certificate for it too
    if [ ! -z "$STAGING_DOMAIN" ]; then
        print_status "Requesting SSL certificate for $STAGING_DOMAIN..."
        docker-compose -f docker-compose.production.yml --env-file .env run --rm certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email "$SSL_EMAIL" \
            --agree-tos \
            --no-eff-email \
            --non-interactive \
            -d "$STAGING_DOMAIN"
    fi
    
    # Update Nginx config to use SSL if certificates exist
    if [ -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
        print_status "SSL certificates found. Updating Nginx configuration..."
        
        # Create SSL-enabled Nginx config
        cat > nginx/nginx-ssl.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    upstream app_production {
        server historian-app:3000;
    }
    upstream strapi_production {
        server historian-strapi:1337;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name evidoxa.com www.evidoxa.com;
        
        # ACME challenge location - must be first!
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
            try_files $uri =404;
        }

        # Redirect all other HTTP traffic to HTTPS
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name evidoxa.com www.evidoxa.com;

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/evidoxa.com-0001/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/evidoxa.com-0001/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Proxy Strapi API endpoints
        location ~ ^/(content-manager|content-type-builder|users-permissions|i18n|upload|email|users|roles|permissions|admin|api) {
            proxy_pass http://strapi_production;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Port $server_port;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
        }       

        # Proxy to Next.js app
        location / {
            proxy_pass http://app_production;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # API routes
        location /api/ {
            proxy_pass http://app_production;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Strapi admin panel
        location /admin/ {
            proxy_pass http://strapi_production;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Port $server_port;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
        }

        # Strapi API
        location /strapi/ {
            proxy_pass http://strapi_production;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Port $server_port;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
        }
    }
}
EOF
        
        # Update docker-compose to use SSL config
        sed -i 's|nginx-simple.conf|nginx-ssl.conf|g' docker-compose.production.yml
        
        print_status "Nginx SSL configuration updated!"
    else
        print_warning "SSL certificates not found. Using HTTP-only configuration."
    fi
    
    print_status "SSL setup completed!"
    print_status "Certificate will auto-renew daily at 12:00 PM"
}

# Function to renew SSL certificates
renew_ssl() {
    print_status "Renewing SSL certificates..."
    
    # Stop nginx temporarily
    docker-compose -f docker-compose.production.yml stop nginx
    
    # Run certbot renewal with non-interactive flag
    docker-compose -f docker-compose.production.yml --env-file .env run --rm certbot renew --non-interactive --keep-until-expiring
    
    # Start nginx again
    docker-compose -f docker-compose.production.yml start nginx
    
    print_status "SSL renewal completed!"
}

# Function to create backup
create_backup() {
    print_status "Creating backup..."
    
    BACKUP_DIR="backups"
    DATE=$(date '+%Y%m%d_%H%M%S')
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup application files
    tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" \
        --exclude=logs \
        --exclude=backups \
        --exclude=node_modules \
        --exclude=.git \
        .
    
    # Backup Docker volumes (if they exist)
    if docker volume ls | grep -q historian-app; then
        docker run --rm \
            -v historian-app_data:/data \
            -v "$(pwd)/$BACKUP_DIR:/backup" \
            alpine tar -czf "/backup/volumes_backup_$DATE.tar.gz" -C /data .
    fi
    
    # Keep only last 7 days of backups
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
    
    print_status "Backup completed: $BACKUP_DIR/app_backup_$DATE.tar.gz"
}

# Function to monitor system
monitor_system() {
    print_status "System Resources:"
    echo "CPU Usage:"
    top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
    
    echo ""
    echo "Memory Usage:"
    free -h
    
    echo ""
    echo "Disk Usage:"
    df -h /
    
    echo ""
    echo "Docker Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "Recent Logs:"
    docker-compose -f docker-compose.production.yml logs --tail=20
}

# Function to update application
update_application() {
    print_status "Updating application from git..."
    
    # Backup current state
    create_backup
    
    # Pull latest changes
    git pull origin main
    
    # Rebuild and restart services
    docker-compose -f docker-compose.production.yml down
    docker-compose -f docker-compose.production.yml build --no-cache
    docker-compose -f docker-compose.production.yml up -d
    
    print_status "Application updated successfully!"
}

# Main script logic
case "$1" in
    up)
        start_services
        ;;
    down)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    ssl)
        setup_ssl
        ;;
    renew)
        renew_ssl
        ;;
    backup)
        create_backup
        ;;
    monitor)
        monitor_system
        ;;
    update)
        update_application
        ;;
    *)
        usage
        exit 1
        ;;
esac 
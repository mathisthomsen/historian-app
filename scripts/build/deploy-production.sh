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

# Paths: script is in scripts/build/, run from repo root (e.g. /opt/historian-app/production)
# Note: Compose is always run with --env-file .env to avoid "variable is not set" warnings
#       (with -f docker/... the project dir is docker/, so .env in repo root is not auto-loaded).
COMPOSE_FILE="docker/docker-compose.production.yml"
NGINX_DIR="docker/nginx"

# Ensure nginx.active.conf exists for initial deployment
mkdir -p "$NGINX_DIR"
cp "$NGINX_DIR/nginx.conf" "$NGINX_DIR/nginx.active.conf" 2>/dev/null || true

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
    if docker-compose -f "$COMPOSE_FILE" --env-file .env ps | grep -q "Up"; then
        return 0
    else
        return 1
    fi
}

# Function to show usage
usage() {
    echo "Usage: $0 {up|down|restart|status|logs|ssl|ssl-bhgv|ssl-wildcard|renew|backup|monitor|update}"
    echo ""
    echo "Commands:"
    echo "  up      - Start all services"
    echo "  down    - Stop all services"
    echo "  restart - Restart all services"
    echo "  status  - Show service status"
    echo "  logs    - Show logs (all services)"
    echo "  ssl         - Set up SSL certificates (main domain from .env, HTTP-01)"
    echo "  ssl-bhgv    - Request SSL cert for bhgv.evidoxa.com and enable full Nginx SSL config"
    echo "  ssl-wildcard - Request wildcard cert (evidoxa.com + *.evidoxa.com) via DNS-01 (Ionos); one cert for both sites"
    echo "  renew       - Renew SSL certificates"
    echo "  backup  - Create database backup"
    echo "  monitor - Show system resources"
    echo "  update  - Update application from git"
}

# Function to start services
start_services() {
    print_status "Starting Historian App services..."
    
    # Create necessary directories
    mkdir -p logs/{production,nginx}
    mkdir -p ssl
    mkdir -p certbot/{conf,www}
    
    # Run Prisma migrations before starting services
    print_status "Running Prisma migrations (npx prisma migrate deploy)..."
    docker-compose -f "$COMPOSE_FILE" --env-file .env run --rm app npx prisma migrate deploy
    print_status "Prisma migrations completed."
    # Start services
    docker-compose -f "$COMPOSE_FILE" --env-file .env up -d
    
    print_status "Services started successfully!"
    print_status "Application will be available at: https://$DOMAIN"
    print_status "Health check at: https://$DOMAIN/health"
}

# Function to stop services
stop_services() {
    print_status "Stopping Historian App services..."
    docker-compose -f "$COMPOSE_FILE" --env-file .env down
    print_status "Services stopped successfully!"
}

# Function to restart services
restart_services() {
    print_status "Restarting Historian App services..."
    docker-compose -f "$COMPOSE_FILE" --env-file .env restart
    print_status "Services restarted successfully!"
}

# Function to show status
show_status() {
    print_status "Service Status:"
    docker-compose -f "$COMPOSE_FILE" --env-file .env ps
    
    echo ""
    print_status "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Function to show logs
show_logs() {
    if [ -z "$1" ]; then
        print_status "Showing logs for all services..."
        docker-compose -f "$COMPOSE_FILE" --env-file .env logs -f
    else
        print_status "Showing logs for $1..."
        docker-compose -f "$COMPOSE_FILE" --env-file .env logs -f "$1"
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

    # Ensure nginx is using HTTP-only config for ACME challenge
    print_status "Ensuring nginx is running with HTTP-only config for ACME challenge..."
    cp "$NGINX_DIR/nginx.conf" "$NGINX_DIR/nginx.active.conf"
    docker-compose -f "$COMPOSE_FILE" --env-file .env up -d nginx

    print_status "Waiting for nginx to be ready..."
    sleep 5

    for i in {1..10}; do
        if curl -s "http://localhost/.well-known/acme-challenge/test" || curl -s "http://127.0.0.1/.well-known/acme-challenge/test"; then
            print_status "nginx is up and serving HTTP."
            break
        else
            print_status "Waiting for nginx to serve HTTP (attempt $i)..."
            sleep 2
        fi
    done

    # Avoid "Another instance of Certbot is already running": stop any certbot container and remove stale lock
    print_status "Ensuring no other Certbot instance or stale lock..."
    docker-compose -f "$COMPOSE_FILE" --env-file .env stop certbot 2>/dev/null || true
    docker-compose -f "$COMPOSE_FILE" --env-file .env rm -f certbot 2>/dev/null || true
    docker-compose -f "$COMPOSE_FILE" --env-file .env run --rm --entrypoint sh certbot -c "rm -f /etc/letsencrypt/.certbot.lock /var/log/letsencrypt/.certbot.lock 2>/dev/null; true" 2>/dev/null || true

    # Run certbot to get certificates for main domain (do not exit on failure so we still restore SSL config if cert exists)
    print_status "Requesting SSL certificate for $DOMAIN..."
    docker-compose -f "$COMPOSE_FILE" --env-file .env run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$SSL_EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        -d "$DOMAIN" || true

    # Update Nginx config to use SSL if certificates exist (always run so we restore SSL config even when certonly failed)
    if docker-compose -f "$COMPOSE_FILE" --env-file .env run --rm certbot certificates 2>/dev/null | grep -q "$DOMAIN"; then
        print_status "SSL certificates found. Switching to SSL-enabled Nginx configuration..."
        # Use full SSL config only if bhgv.evidoxa.com cert exists (otherwise Nginx would fail to start)
        if docker-compose -f "$COMPOSE_FILE" --env-file .env run --rm certbot certificates 2>/dev/null | grep -q "bhgv.evidoxa.com"; then
            cp "$NGINX_DIR/nginx-ssl.conf" "$NGINX_DIR/nginx.active.conf"
        else
            print_warning "bhgv.evidoxa.com cert not in this volume; using evidoxa.com-only SSL config."
            cp "$NGINX_DIR/nginx-ssl-evidoxa-only.conf" "$NGINX_DIR/nginx.active.conf"
        fi
        docker-compose -f "$COMPOSE_FILE" --env-file .env up -d nginx
        sleep 3
        # If Nginx failed to start (e.g. full config but missing bhgv cert), fallback to evidoxa-only
        code=$(curl -k -s -o /dev/null -w "%{http_code}" --connect-timeout 3 https://127.0.0.1:443 -H "Host: $DOMAIN" 2>/dev/null || echo "000")
        if ! echo "$code" | grep -qE "^[23][0-9][0-9]$"; then
            print_warning "Nginx not responding on 443 (got $code). Falling back to evidoxa.com-only SSL config."
            cp "$NGINX_DIR/nginx-ssl-evidoxa-only.conf" "$NGINX_DIR/nginx.active.conf"
            docker-compose -f "$COMPOSE_FILE" --env-file .env up -d nginx
        fi
        print_status "Nginx SSL configuration updated and nginx reloaded!"
    else
        print_warning "SSL certificates not found. Leaving HTTP-only (or existing) Nginx config unchanged."
    fi
    
    print_status "SSL setup completed!"
    print_status "Certificate will auto-renew daily at 12:00 PM"
}

# Function to request SSL for bhgv.evidoxa.com and switch to full Nginx SSL config
setup_ssl_bhgv() {
    print_status "Requesting SSL certificate for bhgv.evidoxa.com and enabling full SSL config..."
    BHGV_DOMAIN="bhgv.evidoxa.com"
    
    if [ -z "$SSL_EMAIL" ]; then
        print_error "SSL_EMAIL not configured in .env"
        exit 1
    fi
    
    mkdir -p certbot/{conf,www}
    mkdir -p certbot/www/.well-known/acme-challenge
    
    print_status "Ensuring nginx is on HTTP-only config for ACME challenge..."
    cp "$NGINX_DIR/nginx.conf" "$NGINX_DIR/nginx.active.conf"
    docker-compose -f "$COMPOSE_FILE" --env-file .env up -d nginx
    sleep 5
    
    docker-compose -f "$COMPOSE_FILE" --env-file .env stop certbot 2>/dev/null || true
    docker-compose -f "$COMPOSE_FILE" --env-file .env rm -f certbot 2>/dev/null || true
    docker-compose -f "$COMPOSE_FILE" --env-file .env run --rm --entrypoint sh certbot -c "rm -f /etc/letsencrypt/.certbot.lock /var/log/letsencrypt/.certbot.lock 2>/dev/null; true" 2>/dev/null || true
    
    print_status "Requesting SSL certificate for $BHGV_DOMAIN..."
    docker-compose -f "$COMPOSE_FILE" --env-file .env run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$SSL_EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        -d "$BHGV_DOMAIN" || true
    
    if docker-compose -f "$COMPOSE_FILE" --env-file .env run --rm certbot certificates 2>/dev/null | grep -q "$BHGV_DOMAIN"; then
        print_status "Certificate for $BHGV_DOMAIN found. Switching to full Nginx SSL config..."
        cp "$NGINX_DIR/nginx-ssl.conf" "$NGINX_DIR/nginx.active.conf"
        docker-compose -f "$COMPOSE_FILE" --env-file .env up -d nginx
        sleep 3
        code=$(curl -k -s -o /dev/null -w "%{http_code}" --connect-timeout 3 https://127.0.0.1:443 -H "Host: evidoxa.com" 2>/dev/null || echo "000")
        if ! echo "$code" | grep -qE "^[23][0-9][0-9]$"; then
            print_warning "Nginx not responding on 443 after full config (got $code). Reverting to evidoxa.com-only."
            cp "$NGINX_DIR/nginx-ssl-evidoxa-only.conf" "$NGINX_DIR/nginx.active.conf"
            docker-compose -f "$COMPOSE_FILE" --env-file .env up -d nginx
        else
            print_status "Nginx updated; both evidoxa.com and bhgv.evidoxa.com should now use valid HTTPS."
        fi
    else
        print_warning "Certificate for $BHGV_DOMAIN not found. Restoring evidoxa.com-only SSL so main site stays up."
        cp "$NGINX_DIR/nginx-ssl-evidoxa-only.conf" "$NGINX_DIR/nginx.active.conf"
        docker-compose -f "$COMPOSE_FILE" --env-file .env up -d nginx
    fi
}

# Function to request wildcard cert (evidoxa.com + *.evidoxa.com) via Ionos DNS-01 and switch to single-cert Nginx config
setup_ssl_wildcard() {
    print_status "Requesting wildcard certificate for evidoxa.com and *.evidoxa.com (DNS-01 via Ionos)..."
    
    if [ -z "$SSL_EMAIL" ]; then
        print_error "SSL_EMAIL not configured in .env"
        exit 1
    fi
    if [ -z "$IONOS_DNS_PREFIX" ] || [ -z "$IONOS_DNS_SECRET" ]; then
        print_error "IONOS_DNS_PREFIX and IONOS_DNS_SECRET must be set in .env (Ionos Remote User API credentials). See docs/development/SSL_WILDCARD_IONOS.md"
        exit 1
    fi
    
    CRED_DIR="certbot-secrets"
    CRED_FILE="$CRED_DIR/ionos.ini"
    mkdir -p "$CRED_DIR"
    chmod 700 "$CRED_DIR"
    cat > "$CRED_FILE" << EOF
dns_ionos_prefix = $IONOS_DNS_PREFIX
dns_ionos_secret = $IONOS_DNS_SECRET
dns_ionos_endpoint = ${IONOS_DNS_ENDPOINT:-https://api.hosting.ionos.com}
EOF
    chmod 600 "$CRED_FILE"
    
    CERTBOT_VOL=$(docker volume ls -q | grep certbot-etc | head -1)
    if [ -z "$CERTBOT_VOL" ]; then
        print_error "Could not find certbot-etc volume. Run 'docker-compose up -d' once to create it."
        exit 1
    fi
    
    print_status "Running certbot with dns-ionos plugin (this may take 1–2 minutes for DNS propagation)..."
    if ! docker run --rm \
        -v "$CERTBOT_VOL:/etc/letsencrypt" \
        -v "$(pwd)/$CRED_DIR:/.secrets:ro" \
        certbot/certbot \
        sh -c "pip install -q certbot-dns-ionos && certbot certonly \
            --authenticator dns-ionos \
            --dns-ionos-credentials /.secrets/ionos.ini \
            --dns-ionos-propagation-seconds 60 \
            --agree-tos \
            --no-eff-email \
            --non-interactive \
            --email $SSL_EMAIL \
            -d evidoxa.com \
            -d '*.evidoxa.com'"; then
        print_error "Certbot wildcard request failed. Check DNS API credentials and that evidoxa.com DNS is at Ionos."
        exit 1
    fi
    
    print_status "Wildcard certificate obtained. Switching Nginx to wildcard config..."
    cp "$NGINX_DIR/nginx-ssl-wildcard.conf" "$NGINX_DIR/nginx.active.conf"
    docker-compose -f "$COMPOSE_FILE" --env-file .env up -d nginx
    print_status "Done. evidoxa.com and bhgv.evidoxa.com now use the same wildcard certificate."
    print_warning "Renewal: run 'certbot renew' with dns-ionos (e.g. same docker run with 'renew' instead of 'certonly'). Consider adding a renew-wildcard cron or script."
}

# Function to renew SSL certificates
renew_ssl() {
    print_status "Renewing SSL certificates..."
    
    # Stop nginx temporarily
    docker-compose -f "$COMPOSE_FILE" --env-file .env stop nginx
    
    # Run certbot renewal with non-interactive flag
    docker-compose -f "$COMPOSE_FILE" --env-file .env run --rm certbot renew --non-interactive --keep-until-expiring
    
    # Start nginx again
    docker-compose -f "$COMPOSE_FILE" --env-file .env start nginx
    
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
    docker-compose -f "$COMPOSE_FILE" --env-file .env logs --tail=20
}

# Function to update application
update_application() {
    print_status "Updating application from git..."
    
    # Backup current state
    create_backup
    
    # Pull latest changes
    git pull origin main
    
    # Rebuild and restart services
    docker-compose -f "$COMPOSE_FILE" --env-file .env down
    docker-compose -f "$COMPOSE_FILE" --env-file .env build --no-cache
    docker-compose -f "$COMPOSE_FILE" --env-file .env up -d
    
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
    ssl-bhgv)
        setup_ssl_bhgv
        ;;
    ssl-wildcard)
        setup_ssl_wildcard
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
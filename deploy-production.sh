#!/bin/bash

# Production Deployment Script for Historian App VPS
# Usage: ./deploy-production.sh [action]
# Examples:
#   ./deploy-production.sh up
#   ./deploy-production.sh down
#   ./deploy-production.sh restart
#   ./deploy-production.sh ssl
#   ./deploy-production.sh backup

set -e

ACTION=${1:-up}

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
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root"
        exit 1
    fi
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install it and try again."
        exit 1
    fi
}

# Function to load environment variables
load_env() {
    local env_file=".env.production"
    if [ ! -f "$env_file" ]; then
        print_error "Production environment file $env_file not found."
        print_warning "Please copy env.production.example to .env.production and configure it."
        exit 1
    fi
    export $(cat "$env_file" | grep -v '^#' | xargs)
    print_status "Loaded environment variables from $env_file"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p logs/production
    mkdir -p logs/nginx
    mkdir -p logs/strapi
    mkdir -p logs/redis
    mkdir -p uploads/production
    mkdir -p uploads/strapi
    mkdir -p nginx/ssl
    mkdir -p nginx/conf.d
    mkdir -p certbot/conf
    mkdir -p certbot/www
    mkdir -p backups
    print_status "Directories created successfully"
}

# Function to check environment variables
check_environment() {
    print_status "Checking environment variables..."
    required_vars=(
        "DOMAIN" "SSL_EMAIL" "DATABASE_URL" "DATABASE_URL_UNPOOLED"
        "JWT_SECRET" "ENCRYPTION_KEY" "REDIS_PASSWORD" "STRAPI_DB_HOST" 
        "STRAPI_DB_NAME" "STRAPI_DB_USER" "STRAPI_DB_PASSWORD" "STRAPI_JWT_SECRET"
        "STRAPI_ADMIN_JWT_SECRET" "STRAPI_APP_KEYS" "STRAPI_API_TOKEN_SALT"
        "WORKOS_API_KEY" "WORKOS_CLIENT_ID" "WORKOS_REDIRECT_URI" 
        "WORKOS_COOKIE_PASSWORD" "AUTHKIT_REDIRECT_URI"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        print_warning "Please set these in your .env.production file"
        exit 1
    fi
    
    print_status "All required environment variables are set"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    docker-compose -f docker-compose.production.yml exec app npx prisma migrate deploy
    print_status "Database migrations completed"
}

# Function to generate Prisma client
generate_prisma_client() {
    print_status "Generating Prisma client..."
    docker-compose -f docker-compose.production.yml exec app npx prisma generate
    print_status "Prisma client generated"
}

# Function to setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    # Check if domain is configured
    if [ "$DOMAIN" = "your-domain.com" ]; then
        print_error "Please configure your domain in .env.production"
        exit 1
    fi
    
    # Create initial nginx config for SSL challenge
    cat > nginx/nginx-ssl.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF
    
    # Start nginx with SSL config
    docker-compose -f docker-compose.production.yml up -d nginx
    
    # Get SSL certificate
    docker-compose -f docker-compose.production.yml run --rm certbot
    
    # Replace nginx config with full config
    cp nginx/nginx.conf nginx/nginx-ssl.conf
    
    # Restart nginx
    docker-compose -f docker-compose.production.yml restart nginx
    
    print_status "SSL certificates setup completed"
}

# Function to start services
start_services() {
    print_status "Starting production services..."
    
    # Create directories
    create_directories
    
    # Check environment
    check_environment
    
    # Start services
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 45
    
    # Run migrations
    run_migrations
    
    # Generate Prisma client
    generate_prisma_client
    
    print_status "Production environment is ready!"
    print_status "Application URL: https://$DOMAIN"
    print_status "Strapi Admin: https://$DOMAIN/admin"
    print_status "Health Check: https://$DOMAIN/health"
}

# Function to stop services
stop_services() {
    print_status "Stopping production services..."
    docker-compose -f docker-compose.production.yml down
    print_status "Production services stopped"
}

# Function to restart services
restart_services() {
    print_status "Restarting production services..."
    stop_services
    start_services
}

# Function to show logs
show_logs() {
    print_status "Showing logs for production environment..."
    docker-compose -f docker-compose.production.yml logs -f
}

# Function to show status
show_status() {
    print_status "Status of production environment:"
    docker-compose -f docker-compose.production.yml ps
}

# Function to backup database
backup_database() {
    local backup_dir="backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_dir}/backup_${timestamp}.sql"
    
    mkdir -p "$backup_dir"
    
    print_status "Creating database backup..."
    
    # Use pg_dump for Neon PostgreSQL
    docker run --rm -v $(pwd)/$backup_dir:/backup postgres:15 pg_dump "$DATABASE_URL" > "$backup_file"
    
    if [ $? -eq 0 ]; then
        print_status "Database backup created: $backup_file"
        
        # Compress backup
        gzip "$backup_file"
        print_status "Backup compressed: ${backup_file}.gz"
        
        # Keep only last 7 backups
        ls -t ${backup_dir}/backup_*.sql.gz | tail -n +8 | xargs -r rm
        print_status "Old backups cleaned up"
    else
        print_error "Database backup failed"
        exit 1
    fi
}

# Function to restore database
restore_database() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        print_error "Please specify a backup file to restore"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file $backup_file not found"
        exit 1
    fi
    
    print_warning "This will overwrite the current database. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Restoring database from $backup_file..."
        
        # Decompress if needed
        if [[ "$backup_file" == *.gz ]]; then
            gunzip -c "$backup_file" | docker run --rm -i postgres:15 psql "$DATABASE_URL"
        else
            docker run --rm -i postgres:15 psql "$DATABASE_URL" < "$backup_file"
        fi
        
        print_status "Database restored successfully"
    else
        print_status "Database restore cancelled"
    fi
}

# Function to monitor system resources
monitor_resources() {
    print_status "System resource usage:"
    echo "Memory usage:"
    free -h
    echo ""
    echo "Disk usage:"
    df -h
    echo ""
    echo "Docker containers:"
    docker stats --no-stream
}

# Function to update application
update_application() {
    print_status "Updating application..."
    
    # Pull latest changes
    git pull origin main
    
    # Rebuild and restart
    docker-compose -f docker-compose.production.yml build
    restart_services
    
    print_status "Application updated successfully"
}

# Main script logic
main() {
    print_status "🚀 Historian App Production Deployment"
    print_status "====================================="

    # Check prerequisites
    check_root
    check_docker
    check_docker_compose
    load_env

    case $ACTION in
        "up")
            start_services
            ;;
        "down")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "ssl")
            setup_ssl
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "backup")
            backup_database
            ;;
        "restore")
            restore_database $2
            ;;
        "monitor")
            monitor_resources
            ;;
        "update")
            update_application
            ;;
        *)
            print_error "Unknown action: $ACTION"
            echo "Available actions: up, down, restart, ssl, logs, status, backup, restore, monitor, update"
            exit 1
            ;;
    esac
}

# Run main function
main 
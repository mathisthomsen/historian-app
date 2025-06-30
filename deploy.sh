#!/bin/bash

# Deployment script for Historian App
# Usage: ./deploy.sh [environment] [action]
# Examples:
#   ./deploy.sh staging up
#   ./deploy.sh production up
#   ./deploy.sh staging down
#   ./deploy.sh production down

set -e

ENVIRONMENT=${1:-staging}
ACTION=${2:-up}

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
    local env_file=".env.${ENVIRONMENT}"
    if [ ! -f "$env_file" ]; then
        print_error "Environment file $env_file not found."
        print_warning "Please copy env.${ENVIRONMENT}.example to .env.${ENVIRONMENT} and configure it."
        exit 1
    fi
    export $(cat "$env_file" | grep -v '^#' | xargs)
    print_status "Loaded environment variables from $env_file"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml exec app npx prisma migrate deploy
    print_status "Database migrations completed"
}

# Function to generate Prisma client
generate_prisma_client() {
    print_status "Generating Prisma client..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml exec app npx prisma generate
    print_status "Prisma client generated"
}

# Function to start services
start_services() {
    print_status "Starting $ENVIRONMENT environment..."
    
    # Create necessary directories
    mkdir -p logs/${ENVIRONMENT}
    mkdir -p uploads/${ENVIRONMENT}
    
    # Start services
    docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Run migrations
    run_migrations
    
    # Generate Prisma client
    generate_prisma_client
    
    print_status "$ENVIRONMENT environment is ready!"
    print_status "Application URL: http://localhost:$(get_app_port)"
    print_status "MailHog URL: http://localhost:$(get_mailhog_port)"
}

# Function to stop services
stop_services() {
    print_status "Stopping $ENVIRONMENT environment..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml down
    print_status "$ENVIRONMENT environment stopped"
}

# Function to restart services
restart_services() {
    print_status "Restarting $ENVIRONMENT environment..."
    stop_services
    start_services
}

# Function to get application port based on environment
get_app_port() {
    case $ENVIRONMENT in
        "staging")
            echo "3001"
            ;;
        "production")
            echo "3000"
            ;;
        *)
            echo "3000"
            ;;
    esac
}

# Function to get MailHog port based on environment
get_mailhog_port() {
    case $ENVIRONMENT in
        "staging")
            echo "8026"
            ;;
        "production")
            echo "8025"
            ;;
        *)
            echo "8025"
            ;;
    esac
}

# Function to show logs
show_logs() {
    print_status "Showing logs for $ENVIRONMENT environment..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml logs -f
}

# Function to show status
show_status() {
    print_status "Status of $ENVIRONMENT environment:"
    docker-compose -f docker-compose.${ENVIRONMENT}.yml ps
}

# Function to backup database
backup_database() {
    local backup_dir="backups/${ENVIRONMENT}"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_dir}/backup_${timestamp}.sql"
    
    mkdir -p "$backup_dir"
    
    print_status "Creating database backup..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > "$backup_file"
    print_status "Database backup created: $backup_file"
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
        docker-compose -f docker-compose.${ENVIRONMENT}.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < "$backup_file"
        print_status "Database restored successfully"
    else
        print_status "Database restore cancelled"
    fi
}

# Main script logic
main() {
    print_status "🚀 Historian App Deployment Script"
    print_status "=================================="

    # Check if git is clean
    if [ -n "$(git status --porcelain)" ]; then
        echo "❌ Git working directory is not clean. Please commit your changes first."
        exit 1
    fi

    # Check if we're on main branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        echo "⚠️  You're not on the main branch. Current branch: $current_branch"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    echo "📦 Building the application..."
    npm run build

    if [ $? -ne 0 ]; then
        echo "❌ Build failed. Please fix the errors and try again."
        exit 1
    fi

    echo "✅ Build successful!"

    echo "🔍 Checking environment variables..."
    required_vars=("DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET")
    missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo "⚠️  Missing environment variables: ${missing_vars[*]}"
        echo "Please set these in your Vercel dashboard before deploying."
    fi

    echo "📤 Pushing to GitHub..."
    git push origin main

    if [ $? -eq 0 ]; then
        echo "✅ Code pushed successfully!"
        echo ""
        echo "🎉 Next steps:"
        echo "1. Go to https://vercel.com"
        echo "2. Import your repository"
        echo "3. Configure environment variables"
        echo "4. Deploy!"
        echo ""
        echo "📖 See DEPLOYMENT.md for detailed instructions"
    else
        echo "❌ Failed to push to GitHub"
        exit 1
    fi
}

# Run main function
main 
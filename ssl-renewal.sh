#!/bin/bash

# SSL Certificate Renewal Script for Historian App Staging
# This script should be run via cron job for automatic renewal

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Change to staging directory
cd /opt/historian-app/staging

# Check if .env.staging exists
if [ ! -f .env.staging ]; then
    print_error ".env.staging file not found!"
    exit 1
fi

# Load environment variables
export $(cat .env.staging | grep -v '^#' | xargs)

print_status "Starting SSL certificate renewal for staging..."

# Stop production nginx temporarily to free port 80
print_status "Stopping production Nginx to free port 80..."
docker stop historian-nginx || true

# Stop staging nginx temporarily to avoid conflicts
print_status "Stopping staging Nginx..."
docker-compose -f docker-compose.staging.yml stop nginx

# Run certbot renewal
print_status "Running certbot renewal for staging..."
docker-compose -f docker-compose.staging.yml --env-file .env.staging run --rm --service-ports certbot renew --non-interactive --keep-until-expiring

# Start staging nginx again
print_status "Starting staging Nginx..."
docker-compose -f docker-compose.staging.yml start nginx

# Start production nginx again
print_status "Starting production Nginx..."
docker start historian-nginx

# Test if certificates are valid
print_status "Testing SSL certificates for staging..."
if curl -f https://staging.evidoxa.com:8443/api/health > /dev/null 2>&1; then
    print_status "SSL renewal completed successfully for staging!"
    print_status "Certificate is valid and working."
else
    print_warning "SSL renewal completed, but health check failed."
    print_warning "Please check the logs: docker-compose -f docker-compose.staging.yml logs nginx"
fi

print_status "SSL renewal process completed for staging at $(date)" 
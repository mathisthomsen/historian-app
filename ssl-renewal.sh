#!/bin/bash

# SSL Certificate Renewal Script for Historian App
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

# Change to production directory
cd /opt/historian-app/production

# Check if .env.production exists
if [ ! -f .env.production ]; then
    print_error ".env.production file not found!"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

print_status "Starting SSL certificate renewal..."

# Stop nginx temporarily to avoid conflicts
print_status "Stopping Nginx..."
docker-compose -f docker-compose.production.yml stop nginx

# Run certbot renewal
print_status "Running certbot renewal..."
docker-compose -f docker-compose.production.yml --env-file .env.production run --rm certbot renew

# Start nginx again
print_status "Starting Nginx..."
docker-compose -f docker-compose.production.yml start nginx

# Test if certificates are valid
print_status "Testing SSL certificates..."
if curl -f https://evidoxa.com/api/health > /dev/null 2>&1; then
    print_status "SSL renewal completed successfully!"
    print_status "Certificate is valid and working."
else
    print_warning "SSL renewal completed, but health check failed."
    print_warning "Please check the logs: docker-compose -f docker-compose.production.yml logs nginx"
fi

print_status "SSL renewal process completed at $(date)" 
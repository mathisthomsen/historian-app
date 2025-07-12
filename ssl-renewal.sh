#!/bin/bash

# SSL Certificate Auto-Renewal Script
# This script should be run via cron job

cd /opt/historian-app/historian-app

# Renew certificates
docker-compose -f docker-compose.production.yml run --rm certbot renew

# Reload nginx to pick up renewed certificates
docker-compose -f docker-compose.production.yml exec nginx nginx -s reload

# Log the renewal attempt
echo "$(date): SSL certificate renewal completed" >> /var/log/ssl-renewal.log 
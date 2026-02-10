# SSL Setup and Renewal Guide

## Overview

This guide explains how SSL certificates are managed for the Historian App production deployment.

## SSL Certificate Management

### Initial Setup

SSL certificates are automatically set up during deployment via the GitHub Actions workflow. The process:

1. **Deployment**: The CI/CD pipeline deploys the application
2. **SSL Setup**: Automatically runs `./deploy-production.sh ssl` to obtain certificates
3. **Nginx Configuration**: Updates Nginx to use SSL and redirect HTTP to HTTPS

### Manual SSL Setup

If you need to set up SSL manually:

```bash
cd /opt/historian-app/production
./deploy-production.sh ssl
```

### SSL Renewal

#### Automatic Renewal

SSL certificates are automatically renewed via cron job. The renewal script is located at:
- `/opt/historian-app/production/ssl-renewal.sh`

To set up automatic renewal, add this to your crontab:

```bash
# Edit crontab
crontab -e

# Add this line for daily renewal attempts (at 2 AM)
0 2 * * * /opt/historian-app/production/ssl-renewal.sh >> /var/log/ssl-renewal.log 2>&1
```

#### Manual Renewal

To manually renew certificates:

```bash
cd /opt/historian-app/production
./deploy-production.sh renew
```

## Configuration Files

### Nginx Configurations

- **HTTP-only**: `nginx/nginx-simple.conf` (used when no SSL certificates exist)
- **SSL-enabled**: `nginx/nginx-ssl.conf` (automatically created when certificates are obtained)

### Docker Compose

The `docker-compose.production.yml` file includes:
- Certbot service for SSL certificate management
- Volume mounts for certificate storage
- Nginx service with SSL support

## Environment Variables

Required SSL-related environment variables in `.env.production`:

```bash
DOMAIN=evidoxa.com
SSL_EMAIL=admin@evidoxa.com
```

## Troubleshooting

### Certificate Issues

1. **Check certificate status**:
   ```bash
   docker-compose -f docker-compose.production.yml run --rm certbot certificates
   ```

2. **Force certificate renewal**:
   ```bash
   docker-compose -f docker-compose.production.yml run --rm certbot renew --force-renewal
   ```

3. **Check Nginx logs**:
   ```bash
   docker-compose -f docker-compose.production.yml logs nginx
   ```

### ACME Challenge Issues

If certificate renewal fails due to ACME challenge issues:

1. **Verify ACME challenge path**:
   ```bash
   curl -I http://evidoxa.com/.well-known/acme-challenge/test
   ```

2. **Check Nginx configuration**:
   ```bash
   docker exec historian-nginx nginx -t
   ```

3. **Restart Nginx**:
   ```bash
   docker exec historian-nginx nginx -s reload
   ```

## Security Notes

- SSL certificates are automatically renewed before expiration
- HTTP traffic is automatically redirected to HTTPS
- ACME challenge files are properly secured and cleaned up
- SSL configuration uses modern ciphers and protocols

## Monitoring

Monitor SSL certificate status:

```bash
# Check certificate expiration
openssl x509 -in /opt/historian-app/production/certbot/conf/live/evidoxa.com-0001/fullchain.pem -text -noout | grep "Not After"

# Check renewal logs
tail -f /var/log/ssl-renewal.log
``` 
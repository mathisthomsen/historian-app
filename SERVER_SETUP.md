# Historian App - Server Setup Guide

This guide will help you set up your VPS to host the Historian App with Docker, Nginx, SSL, and proper monitoring.

## Prerequisites

- Ubuntu 24.04 LTS VPS (4 vCPU, 8GB RAM, 240GB NVMe SSD recommended)
- Domain name pointing to your server
- SSH access to your server
- Root or sudo access

## Step 1: Initial Server Setup

### 1.1 Connect to your server
```bash
ssh root@your-server-ip
```

### 1.2 Run the server setup script
```bash
# Download the setup script
wget https://raw.githubusercontent.com/mathisthomsen/historian_app/main/server-setup.sh
chmod +x server-setup.sh

# Run the setup script
./server-setup.sh
```

This script will:
- Update the system
- Install Docker and Docker Compose
- Configure firewall (UFW)
- Set up fail2ban for security
- Configure system limits for better performance
- Set up log rotation
- Create application user
- Configure SSL certificate renewal
- Set up monitoring and backup scripts

### 1.3 Switch to the application user
```bash
su - historian
```

## Step 2: Deploy the Application

### 2.1 Clone the repository
```bash
cd /opt
git clone https://github.com/mathisthomsen/historian_app.git historian-app
cd historian-app
```

### 2.2 Configure environment variables
```bash
# Copy the production environment template
cp env.production.example .env.production

# Edit the environment file
nano .env.production
```

Configure the following variables in `.env.production`:

#### Domain Configuration
```bash
DOMAIN=your-domain.com
SSL_EMAIL=your-email@domain.com
```

#### Database Configuration (Neon)
```bash
DATABASE_URL="postgresql://username:password@ep-something-pooler.region.aws.neon.tech/database?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://username:password@ep-something.region.aws.neon.tech/database?sslmode=require"
```

#### Security Keys
```bash
NEXTAUTH_SECRET="your-super-secret-nextauth-key-here"
JWT_SECRET="your-super-secret-jwt-key-here"
ENCRYPTION_KEY="your-32-character-encryption-key-here"
```

#### Strapi Configuration
```bash
STRAPI_DB_HOST=your-neon-strapi-host.region.aws.neon.tech
STRAPI_DB_NAME=strapi_production
STRAPI_DB_USER=your-strapi-db-user
STRAPI_DB_PASSWORD=your-strapi-db-password
STRAPI_JWT_SECRET=your-strapi-jwt-secret-here
STRAPI_ADMIN_JWT_SECRET=your-strapi-admin-jwt-secret-here
STRAPI_APP_KEYS=your-strapi-app-keys-here
STRAPI_API_TOKEN_SALT=your-strapi-api-token-salt-here
```

#### Other Required Variables
```bash
NEXTAUTH_URL="https://your-domain.com"
REDIS_PASSWORD="your-redis-password-here"
WORKOS_API_KEY=your-workos-api-key-here
WORKOS_CLIENT_ID=your-workos-client-id-here
WORKOS_REDIRECT_URI=https://your-domain.com/api/auth/callback
WORKOS_COOKIE_PASSWORD=your-workos-cookie-password-here
AUTHKIT_REDIRECT_URI=https://your-domain.com/api/auth/callback
```

### 2.3 Deploy the application
```bash
# Start the services
./deploy-production.sh up

# Check the status
./deploy-production.sh status

# View logs
./deploy-production.sh logs
```

### 2.4 Set up SSL certificates
```bash
# Configure your domain DNS first, then:
./deploy-production.sh ssl
```

## Step 3: Post-Deployment Configuration

### 3.1 Access your application
- Main application: `https://your-domain.com`
- Strapi admin: `https://your-domain.com/admin`
- Health check: `https://your-domain.com/health`

### 3.2 Set up Strapi
1. Visit `https://your-domain.com/admin`
2. Create your admin account
3. Configure your content types and navigation
4. Set up your pages and components

### 3.3 Configure your domain
Make sure your domain's DNS A record points to your server's IP address.

## Step 4: Monitoring and Maintenance

### 4.1 Useful commands
```bash
# Check application status
./deploy-production.sh status

# View logs
./deploy-production.sh logs

# Monitor system resources
./deploy-production.sh monitor

# Create database backup
./deploy-production.sh backup

# Restart services
./deploy-production.sh restart

# Update application
./deploy-production.sh update
```

### 4.2 Automatic tasks
The setup script configures the following automatic tasks:
- **SSL renewal**: Daily at 12:00 PM
- **Database backup**: Daily at 2:00 AM
- **System monitoring**: Every 5 minutes

### 4.3 Log locations
- Application logs: `/opt/historian-app/logs/production/`
- Nginx logs: `/opt/historian-app/logs/nginx/`
- Strapi logs: `/opt/historian-app/logs/strapi/`
- System logs: `/var/log/`

## Step 5: Security Considerations

### 5.1 Firewall
The server setup configures UFW with:
- SSH access (port 22)
- HTTP (port 80)
- HTTPS (port 443)

### 5.2 Fail2ban
Protects against:
- SSH brute force attacks
- Nginx authentication attacks
- Rate limiting violations

### 5.3 SSL/TLS
- Automatic certificate renewal
- Modern SSL configuration
- HSTS headers

## Step 6: Performance Optimization

### 6.1 System limits
The setup script configures:
- Increased file descriptor limits
- Optimized network settings
- Memory management settings

### 6.2 Docker optimization
- Health checks for all services
- Resource limits (configurable)
- Proper logging configuration

## Troubleshooting

### Common issues

#### 1. Services not starting
```bash
# Check Docker logs
docker-compose -f docker-compose.production.yml logs

# Check system resources
./deploy-production.sh monitor
```

#### 2. SSL certificate issues
```bash
# Check certificate status
docker-compose -f docker-compose.production.yml run --rm certbot certificates

# Renew certificates manually
./deploy-production.sh ssl
```

#### 3. Database connection issues
```bash
# Test database connection
docker-compose -f docker-compose.production.yml exec app npx prisma db pull

# Check environment variables
docker-compose -f docker-compose.production.yml exec app env | grep DATABASE
```

#### 4. Strapi not accessible
```bash
# Check Strapi logs
docker-compose -f docker-compose.production.yml logs strapi

# Restart Strapi
docker-compose -f docker-compose.production.yml restart strapi
```

### Performance monitoring
```bash
# Check resource usage
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker resource usage
docker stats
```

## Backup and Recovery

### Database backup
```bash
# Manual backup
./deploy-production.sh backup

# Restore from backup
./deploy-production.sh restore backups/backup_YYYYMMDD_HHMMSS.sql.gz
```

### File backup
```bash
# Backup uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Backup configuration
tar -czf config-backup-$(date +%Y%m%d).tar.gz .env.production nginx/ strapi/
```

## Updates and Maintenance

### Application updates
```bash
# Pull latest changes
git pull origin main

# Update application
./deploy-production.sh update
```

### System updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart services if needed
./deploy-production.sh restart
```

## Support

If you encounter issues:
1. Check the logs: `./deploy-production.sh logs`
2. Verify environment variables are set correctly
3. Ensure your domain DNS is configured properly
4. Check system resources: `./deploy-production.sh monitor`

For additional help, refer to the main README.md file or create an issue in the repository. 
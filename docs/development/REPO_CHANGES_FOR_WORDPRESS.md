# Repository-Änderungen für WordPress-Integration

## ✅ Dateien die ins Repo müssen

### 1. Nginx Configuration
**Datei:** `docker/nginx/nginx-ssl.conf`
- ✅ Erweitert um WordPress Subdomain (`bhgv.evidoxa.com`)
- ✅ Multi-Domain Support
- ✅ FastCGI Config für PHP-FPM
- ✅ WordPress-spezifische Security Rules

**Status:** Bereits im Repo, muss committed werden

### 2. Docker Compose Production
**Datei:** `docker/docker-compose.production.yml`
- ✅ WordPress Network hinzugefügt (`wordpress-network`)
- ✅ WordPress Volume hinzugefügt (`wordpress_data`)
- ✅ Nginx hat Zugriff auf beide Networks

**Status:** Bereits im Repo, muss committed werden

### 3. WordPress Docker Compose
**Datei:** `docker/wordpress/docker-compose.yml`
- ✅ MySQL Container
- ✅ WordPress PHP-FPM Container
- ✅ Network und Volume Konfiguration

**Status:** Bereits im Repo, muss committed werden

### 4. WordPress Environment Template
**Datei:** `docker/wordpress/env.example`
- ✅ Template für .env Datei
- ✅ Wird auf dem Server zu .env kopiert

**Status:** Bereits im Repo, muss committed werden

### 5. WordPress PHP Config
**Datei:** `docker/wordpress/wordpress/uploads.ini`
- ✅ PHP Upload Limits
- ✅ Memory Limits

**Status:** Bereits im Repo, muss committed werden

### 6. Helper Scripts
**Verzeichnis:** `scripts/wordpress/`
- ✅ `setup-wordpress.sh` - Setup auf Server
- ✅ `generate-wordpress-env.sh` - .env Generator
- ✅ `create-ssl-for-subdomain.sh` - SSL Setup
- ✅ `fix-wordpress-ssl-redirects.sh` - SSL Fixes
- ✅ `fix-wordpress-urls.sh` - URL Fixes

**Status:** Bereits im Repo, muss committed werden

### 7. Dokumentation
**Datei:** `docs/development/WORDPRESS_INTEGRATION.md`
- ✅ Architektur-Übersicht
- ✅ Deployment-Informationen

**Status:** Bereits im Repo, muss committed werden

## ❌ Dateien die NICHT ins Repo müssen

### Server-spezifische Dateien
- ❌ `/opt/wordpress-client/production/.env` - Enthält Passwörter
- ❌ `/opt/wordpress-client/production/docker-compose.yml` - Wird vom Repo kopiert
- ❌ WordPress wp-config.php Änderungen - Werden auf dem Server gemacht
- ❌ SSL-Zertifikate - Werden von Certbot generiert

**Hinweis:** Diese sind bereits in `.gitignore` oder werden nicht versioniert.

## 📝 Git Commit Checkliste

```bash
# 1. Nginx Config
git add docker/nginx/nginx-ssl.conf

# 2. Docker Compose
git add docker/docker-compose.production.yml

# 3. WordPress Files
git add docker/wordpress/

# 4. Scripts
git add scripts/wordpress/

# 5. Dokumentation
git add docs/development/WORDPRESS_INTEGRATION.md
git add docs/development/REPO_CHANGES_FOR_WORDPRESS.md

# 6. Commit
git commit -m "Add WordPress integration for bhgv.evidoxa.com subdomain

- Extended Nginx config for multi-domain support
- Added WordPress Docker Compose stack
- Added WordPress helper scripts
- Updated docker-compose.production.yml for WordPress network access"
```

## 🔄 Deployment-Workflow

### Historian App Deployment
1. Code wird zu `/opt/historian-app/production` deployed
2. Nginx Config wird automatisch aktualisiert
3. Nginx Container wird neu gestartet

### WordPress Deployment (separates Repo)
1. WordPress Repo wird zu `/opt/wordpress-client/production` deployed
2. Docker Compose wird ausgeführt
3. WordPress Container werden aktualisiert

## ⚠️ Wichtige Hinweise

1. **WordPress Volume:** Das Volume `production_wordpress_data` muss auf dem Server existieren, bevor Nginx gestartet wird
2. **Network:** Das Network `wordpress-network` muss existieren
3. **SSL:** Zertifikate werden separat mit Certbot erstellt
4. **Passwörter:** Werden auf dem Server generiert und sind nicht im Repo

## 🧪 Testing

Nach dem Commit und Deployment:
1. Prüfe ob beide Domains funktionieren:
   - https://evidoxa.com (Historian App)
   - https://bhgv.evidoxa.com (WordPress)
2. Prüfe SSL-Zertifikate
3. Prüfe Container Status

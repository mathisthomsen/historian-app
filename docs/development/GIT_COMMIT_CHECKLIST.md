# Git Commit Checkliste - WordPress Integration

## Dateien die committed werden müssen

### ✅ Muss committed werden

```bash
# 1. Nginx Configuration (erweitert für WordPress)
git add docker/nginx/nginx-ssl.conf

# 2. Docker Compose Production (WordPress Network/Volume)
git add docker/docker-compose.production.yml

# 3. WordPress Docker Compose Stack
git add docker/wordpress/docker-compose.yml
git add docker/wordpress/env.example
git add docker/wordpress/wordpress/uploads.ini

# 4. WordPress Helper Scripts
git add scripts/wordpress/

# 5. Dokumentation
git add docs/development/WORDPRESS_INTEGRATION.md
git add docs/development/WORDPRESS_THEME_MIGRATION.md
git add docs/development/REPO_CHANGES_FOR_WORDPRESS.md
git add docs/development/GIT_COMMIT_CHECKLIST.md
```

### ❌ Sollte NICHT committed werden

- `.env` Dateien (bereits in .gitignore)
- Server-spezifische Passwörter
- WordPress wp-config.php Änderungen (werden auf Server gemacht)
- SSL-Zertifikate (werden von Certbot generiert)

## Commit Command

```bash
git add docker/nginx/nginx-ssl.conf \
        docker/docker-compose.production.yml \
        docker/wordpress/ \
        scripts/wordpress/ \
        docs/development/WORDPRESS*.md \
        docs/development/REPO_CHANGES_FOR_WORDPRESS.md \
        docs/development/GIT_COMMIT_CHECKLIST.md

git commit -m "Add WordPress integration for bhgv.evidoxa.com subdomain

- Extended Nginx config for multi-domain support (evidoxa.com + bhgv.evidoxa.com)
- Added WordPress Docker Compose stack with MySQL and PHP-FPM
- Added WordPress helper scripts for setup, SSL, and migration
- Updated docker-compose.production.yml for WordPress network access
- Added comprehensive documentation for WordPress integration and migration"
```

## Nach dem Commit

1. **Push zu Repository:**
   ```bash
   git push origin main
   ```

2. **Deployment wird automatisch ausgelöst** (falls GitHub Actions aktiv)
   - Nginx Config wird aktualisiert
   - Docker Compose wird neu geladen

3. **Manuelles Deployment (falls nötig):**
   ```bash
   # Auf Server
   cd /opt/historian-app/production
   git pull
   docker-compose -f docker-compose.production.yml restart nginx
   ```

## Prüfung nach Deployment

- ✅ https://evidoxa.com funktioniert (Historian App)
- ✅ https://bhgv.evidoxa.com funktioniert (WordPress)
- ✅ SSL-Zertifikate sind gültig
- ✅ Container laufen

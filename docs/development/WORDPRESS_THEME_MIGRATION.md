# WordPress Theme & Content Migration von Local zu Production

## Übersicht

Diese Anleitung beschreibt, wie du ein WordPress Theme und Content von einem lokalen "Local" Setup auf die Production-Instanz (`bhgv.evidoxa.com`) überträgst.

## Voraussetzungen

- WordPress läuft lokal in "Local" App
- Production WordPress ist eingerichtet auf `bhgv.evidoxa.com`
- SSH-Zugriff auf Production Server
- Zugriff auf lokale WordPress-Datenbank

### WordPress-Container mit DB-Zugriff starten (Production)

Der WordPress-Container braucht MySQL-Zugangsdaten aus der `.env`. Stehen sie nicht in der Production-.env, erscheint „Error establishing a database connection“.

**Variablen prüfen, mit denen MySQL läuft:**
```bash
docker inspect wordpress-mysql --format '{{range .Config.Env}}{{println .}}{{end}}' | grep MYSQL
```

**Gleiche Werte in `/opt/historian-app/production/.env` eintragen** (z. B. `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, optional `MYSQL_USER`, `MYSQL_DATABASE`). Siehe `docker/wordpress/env.example`.

**WordPress mit dieser .env starten:**
```bash
cd /opt/historian-app/production
docker-compose -f docker/wordpress/docker-compose.yml --env-file .env up -d wordpress --no-deps
```
Nach Änderung an der .env: `--force-recreate` verwenden, damit der Container die neuen Variablen lädt.

**GitHub Secrets (empfohlen):** Damit die Server-.env bei jedem Deploy die MySQL-Daten erhält, im Repository unter **Settings → Secrets and variables → Actions** anlegen:
- `MYSQL_PASSWORD` – Passwort des MySQL-Benutzers (z. B. `wp_user`)
- `MYSQL_ROOT_PASSWORD` – MySQL-Root-Passwort (darf gleich sein wie oben, muss aber dem laufenden MySQL-Container entsprechen)

Danach schreibt der Deploy-Workflow diese Werte in die Production-.env; ein manuelles Eintragen auf dem Server ist nicht mehr nötig.

## Schritt 1: Theme exportieren

### Option A: Theme als ZIP (empfohlen für Custom Themes)

```bash
# Im lokalen WordPress Verzeichnis
cd /path/to/local/wordpress/wp-content/themes/

# Erstelle ZIP vom Theme
zip -r my-theme.zip my-theme-name/

# Oder falls Theme in einem Git Repo ist:
# Theme direkt aus Git Repo verwenden
```

### Option B: Theme via Git (wenn Theme in eigenem Repo)

```bash
# Auf Production Server
ssh root@217.154.198.215

# Theme-Verzeichnis erstellen
docker exec wordpress-app mkdir -p /var/www/html/wp-content/themes/my-theme-name

# Git Repo klonen (falls Theme in Git)
# Oder manuell Dateien kopieren
```

## Schritt 2: Theme auf Production hochladen

### Methode 1: Via Docker Copy (einfach)

```bash
# Von lokalem Rechner
# 1. Theme ZIP erstellen (siehe oben)

# 2. ZIP auf Server kopieren
scp my-theme.zip root@217.154.198.215:/tmp/

# 3. ZIP in WordPress Container kopieren
ssh root@217.154.198.215
docker cp /tmp/my-theme.zip wordpress-app:/tmp/

# 4. Im Container entpacken
docker exec wordpress-app sh -c "cd /var/www/html/wp-content/themes && unzip /tmp/my-theme.zip"

# 5. Berechtigungen setzen
docker exec wordpress-app chown -R www-data:www-data /var/www/html/wp-content/themes
```

### Methode 2: Via WordPress Admin (einfachste Methode)

1. Öffne https://bhgv.evidoxa.com/wp-admin
2. Gehe zu **Design → Themes → Add New → Upload Theme**
3. Lade Theme-ZIP hoch
4. Theme aktivieren

#### Fehler: „Es fehlt ein temporärer Ordner“

WordPress braucht einen beschreibbaren temporären Ordner für den Upload. So behebst du es:

**Option A: PHP-Konfiguration (Projekt enthält bereits die Anpassung)**

Im Repo ist in `docker/wordpress/wordpress/uploads.ini` bereits `upload_tmp_dir = /tmp` gesetzt. Nach einem Deploy den Container neu starten:

```bash
ssh root@217.154.198.215
docker restart wordpress-app
```

**Option B: Wenn PHP im Container die uploads.ini nicht lädt (`php -i` zeigt „no value“)**

Dann erzwingst du einen Temp-Ordner direkt in WordPress (funktioniert unabhängig von PHP):

```bash
ssh root@217.154.198.215

# 1. Temp-Ordner anlegen und für den Webserver schreibbar machen
docker exec wordpress-app mkdir -p /var/www/html/wp-content/temp
docker exec wordpress-app chown www-data:www-data /var/www/html/wp-content/temp
docker exec wordpress-app chmod 775 /var/www/html/wp-content/temp

# 2. WP_TEMP_DIR in wp-config.php eintragen (vor require_once wp-settings.php)
# Hinweis: Wenn deine wp-config "require_once( ABSPATH ..." mit Klammern hat, ersetze die Zeile unten entsprechend.
docker exec wordpress-app sed -i "/require_once ABSPATH . 'wp-settings.php';/i define( 'WP_TEMP_DIR', dirname(__FILE__) . '/wp-content/temp' );" /var/www/html/wp-config.php
```

Danach Theme-Upload im Admin erneut testen.

**Debug: Was sieht WordPress im Web-Kontext? (wenn Upload weiterhin fehlschlägt)**

Einmalig eine kleine PHP-Datei aufrufen (danach wieder löschen), um Temp-Pfad und Schreibrechte zu prüfen:

```bash
# Auf dem Server: Debug-Datei anlegen (als root, wird von www-data ausgeführt)
docker exec wordpress-app sh -c 'echo "<?php require \"wp-load.php\"; header(\"Content-type: text/plain\"); \$t = get_temp_dir(); echo \"get_temp_dir: \" . \$t . \"\nwritable: \" . (is_writable(\$t) ? \"yes\" : \"no\") . \"\n\";" > /var/www/html/wp-content/temp-check.php'
docker exec wordpress-app chown www-data:www-data /var/www/html/wp-content/temp-check.php
```

Dann im Browser: `https://bhgv.evidoxa.com/wp-content/temp-check.php` aufrufen. Erwartung: `get_temp_dir: /var/www/html/wp-content/temp` und `writable: yes`. Anschließend löschen:

```bash
docker exec wordpress-app rm /var/www/html/wp-content/temp-check.php
```

**Option C: Nur prüfen (ohne Fix)**

```bash
# Prüfen, ob /tmp im Container existiert und beschreibbar ist
docker exec wordpress-app ls -la /tmp
docker exec wordpress-app touch /tmp/test-wp && docker exec wordpress-app rm /tmp/test-wp
# Prüfen, ob uploads.ini im Container ankommt
docker exec wordpress-app cat /usr/local/etc/php/conf.d/uploads.ini
docker exec wordpress-app php -i | grep -E "upload_tmp_dir|sys_temp_dir"
```

**Option D: Theme ohne Admin-Upload einspielen (Methode 1)**

Theme-ZIP per SCP auf den Server kopieren und im Container nach `wp-content/themes` entpacken (siehe Methode 1 oben) – dann wird der temporäre Ordner im WordPress-Admin nicht benötigt.

## Schritt 3: Content exportieren

### WordPress Export Tool (empfohlen)

1. **Lokal in WordPress:**
   - Gehe zu **Tools → Export**
   - Wähle "All content" oder spezifische Content-Typen
   - Klicke "Download Export File"
   - Speichere `wordpress-export.xml`

2. **Auf Production importieren:**
   - Gehe zu https://bhgv.evidoxa.com/wp-admin
   - Gehe zu **Tools → Import → WordPress**
   - Falls Import-Plugin fehlt: Installiere "WordPress Importer"
   - Lade `wordpress-export.xml` hoch
   - Wähle "Download and import file attachments" (für Bilder)
   - Klicke "Submit"

### Alternative: Datenbank-Export (für fortgeschrittene Nutzer)

```bash
# Lokal: Datenbank exportieren
# In Local App: Database → Export
# Oder via Command Line:
mysqldump -u root -p local_wordpress_db > wordpress-export.sql

# Auf Production importieren:
ssh root@217.154.198.215

# SQL-Datei auf Server kopieren
scp wordpress-export.sql root@217.154.198.215:/tmp/

# In MySQL Container importieren
docker exec -i wordpress-mysql mysql -u wp_user -p wordpress < /tmp/wordpress-export.sql

# WICHTIG: URLs in Datenbank ersetzen!
# Siehe Schritt 4
```

## Schritt 4: URLs in Datenbank ersetzen

**WICHTIG:** Nach dem Import müssen URLs von lokal zu Production geändert werden.

### Option A: WordPress Search & Replace Plugin

1. Installiere Plugin "Better Search Replace" oder "Search Replace DB"
2. Gehe zu **Tools → Search Replace**
3. Ersetze:
   - `http://local-site.local` → `https://bhgv.evidoxa.com`
   - Oder die URL die du lokal verwendet hast

### Option B: Via WP-CLI (wenn verfügbar)

```bash
ssh root@217.154.198.215

# WP-CLI installieren (falls nicht vorhanden)
docker exec wordpress-app sh -c "curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && chmod +x wp-cli.phar && mv wp-cli.phar /usr/local/bin/wp"

# URLs ersetzen
docker exec wordpress-app wp search-replace 'http://local-site.local' 'https://bhgv.evidoxa.com' --allow-root --all-tables

# Prüfe Ersetzungen
docker exec wordpress-app wp search-replace 'http://local-site.local' 'https://bhgv.evidoxa.com' --allow-root --dry-run
```

### Option C: Via SQL (manuell)

```bash
ssh root@217.154.198.215

# MySQL Container öffnen
docker exec -it wordpress-mysql mysql -u wp_user -p wordpress

# In MySQL:
USE wordpress;
UPDATE wp_options SET option_value = 'https://bhgv.evidoxa.com' WHERE option_name = 'siteurl';
UPDATE wp_options SET option_value = 'https://bhgv.evidoxa.com' WHERE option_name = 'home';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'http://local-site.local', 'https://bhgv.evidoxa.com');
UPDATE wp_posts SET guid = REPLACE(guid, 'http://local-site.local', 'https://bhgv.evidoxa.com');
```

## Schritt 5: Uploads/Medien kopieren

### Via Docker Copy

```bash
# Lokal: Uploads-Verzeichnis finden
# In Local App: wp-content/uploads/

# 1. Uploads-Verzeichnis komprimieren
cd /path/to/local/wordpress/wp-content/
tar -czf uploads.tar.gz uploads/

# 2. Auf Server kopieren
scp uploads.tar.gz root@217.154.198.215:/tmp/

# 3. In WordPress Container kopieren
ssh root@217.154.198.215
docker cp /tmp/uploads.tar.gz wordpress-app:/tmp/

# 4. Im Container entpacken
docker exec wordpress-app sh -c "cd /var/www/html/wp-content && tar -xzf /tmp/uploads.tar.gz"

# 5. Berechtigungen setzen
docker exec wordpress-app chown -R www-data:www-data /var/www/html/wp-content/uploads
```

## Schritt 6: Plugins (falls nötig)

### Option A: Via WordPress Admin
1. Gehe zu **Plugins → Add New**
2. Installiere benötigte Plugins

### Option B: Via Docker Copy (für Custom Plugins)

```bash
# Ähnlich wie Theme (siehe Schritt 2)
# Nur in wp-content/plugins/ statt themes/
```

## Schritt 7: Permalinks neu setzen

Nach dem Import:

1. Gehe zu https://bhgv.evidoxa.com/wp-admin
2. Gehe zu **Settings → Permalinks**
3. Klicke "Save Changes" (ohne Änderungen)
4. Dies regeneriert die .htaccess Datei

## Schritt 8: Finale Checks

### 1. Theme aktivieren
- Gehe zu **Appearance → Themes**
- Aktiviere dein Theme

### 2. Menüs prüfen
- Gehe zu **Appearance → Menus**
- Prüfe ob Menüs korrekt sind

### 3. Widgets prüfen
- Gehe zu **Appearance → Widgets**
- Prüfe Widget-Konfiguration

### 4. Homepage setzen
- Gehe zu **Settings → Reading**
- Setze Homepage falls nötig

## Troubleshooting

### Problem: Bilder werden nicht angezeigt
**Lösung:**
```bash
# URLs in Datenbank prüfen
docker exec wordpress-app wp search-replace 'http://' 'https://' --allow-root --all-tables --dry-run
```

### Problem: Theme-Funktionen funktionieren nicht
**Lösung:**
- Prüfe Theme-Dependencies (Plugins)
- Prüfe PHP-Version (sollte 8.2 sein)
- Prüfe Theme-Logs

### Problem: Permalinks funktionieren nicht
**Lösung:**
- Prüfe .htaccess Datei
- Prüfe Nginx Config (sollte `try_files` haben)
- Setze Permalinks neu (siehe Schritt 7)

## Automatisierung (Optional)

### Script für komplette Migration

```bash
#!/bin/bash
# migrate-wordpress.sh

LOCAL_WP_PATH="/path/to/local/wordpress"
PROD_SERVER="root@217.154.198.215"
PROD_URL="https://bhgv.evidoxa.com"
LOCAL_URL="http://local-site.local"

# 1. Export Content
wp export --path="$LOCAL_WP_PATH" --allow-root > wordpress-export.xml

# 2. Theme ZIP
cd "$LOCAL_WP_PATH/wp-content/themes"
zip -r my-theme.zip my-theme-name/

# 3. Uploads ZIP
cd "$LOCAL_WP_PATH/wp-content"
tar -czf uploads.tar.gz uploads/

# 4. Auf Server kopieren
scp wordpress-export.xml my-theme.zip uploads.tar.gz $PROD_SERVER:/tmp/

# 5. Auf Server importieren (siehe oben)
```

## Zusammenfassung

1. ✅ Theme exportieren (ZIP oder Git)
2. ✅ Theme auf Production hochladen
3. ✅ Content exportieren (WordPress Export Tool)
4. ✅ Content importieren
5. ✅ URLs ersetzen (lokal → Production)
6. ✅ Uploads kopieren
7. ✅ Plugins installieren
8. ✅ Permalinks neu setzen
9. ✅ Finale Checks

## Nächste Schritte

Nach erfolgreicher Migration:
- Teste alle Seiten
- Prüfe Bilder und Medien
- Teste Formulare und Plugins
- Setze Backups ein

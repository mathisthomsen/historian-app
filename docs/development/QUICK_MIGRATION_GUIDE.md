# Quick Guide: WordPress Theme & Content von Local zu Production

## 🚀 Schnellstart

### Schritt 1: Theme migrieren

```bash
# Im WordPress Theme Repo (Cursor Projekt)
cd /path/to/wordpress-theme-repo

# Script ausführen
bash /path/to/historian_app/scripts/wordpress/migrate-theme-from-local.sh \
  ~/LocalSites/mysite/app/public/wp-content/themes/my-theme \
  my-theme
```

**Oder manuell:**
1. Theme als ZIP exportieren
2. In WordPress Admin: **Design → Themes → Add New → Upload Theme**
3. ZIP hochladen und aktivieren

### Schritt 2: Content exportieren (lokal)

1. Öffne lokales WordPress in "Local" App
2. Gehe zu **Tools → Export**
3. Wähle "All content"
4. Klicke "Download Export File"
5. Speichere `wordpress-export.xml`

### Schritt 3: Content importieren (Production)

**Option A: Via WordPress Admin (einfachste Methode)**
1. Öffne https://bhgv.evidoxa.com/wp-admin
2. Gehe zu **Tools → Import → WordPress**
3. Installiere "WordPress Importer" Plugin falls nötig
4. Lade `wordpress-export.xml` hoch
5. Wähle "Download and import file attachments"
6. Klicke "Submit"

**Option B: Via Script**
```bash
bash /path/to/historian_app/scripts/wordpress/migrate-content-from-local.sh \
  wordpress-export.xml \
  http://mysite.local
```

### Schritt 4: URLs ersetzen

**Via Plugin (empfohlen):**
1. Installiere Plugin "Better Search Replace"
2. Gehe zu **Tools → Better Search Replace**
3. Ersetze: `http://mysite.local` → `https://bhgv.evidoxa.com`
4. Prüfe "Run as dry run?" zuerst
5. Dann ohne Dry Run ausführen

### Schritt 5: Uploads/Medien kopieren

```bash
# Script ausführen
bash /path/to/historian_app/scripts/wordpress/migrate-uploads-from-local.sh \
  ~/LocalSites/mysite/app/public/wp-content/uploads
```

**Oder manuell:**
1. Komprimiere `wp-content/uploads/` lokal
2. Kopiere auf Server: `scp uploads.tar.gz root@217.154.198.215:/tmp/`
3. Im Container entpacken (siehe vollständige Anleitung)

### Schritt 6: Permalinks neu setzen

1. Gehe zu **Settings → Permalinks**
2. Klicke "Save Changes" (ohne Änderungen)

## ✅ Checkliste

- [ ] Theme hochgeladen und aktiviert
- [ ] Content importiert
- [ ] URLs ersetzt (lokal → Production)
- [ ] Uploads kopiert
- [ ] Permalinks neu gesetzt
- [ ] Alle Seiten getestet
- [ ] Bilder werden angezeigt
- [ ] Menüs funktionieren

## 📚 Vollständige Anleitung

Siehe: `docs/development/WORDPRESS_THEME_MIGRATION.md`

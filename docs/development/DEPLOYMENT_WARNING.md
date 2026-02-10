# ⚠️ Deployment-Warnung: WordPress Integration

## Aktueller Status

- **Branch:** `feature/project-integration`
- **GitHub Actions:** Deployed nur von `main` Branch
- **Push auf Feature Branch:** ✅ **SICHER** (kein Auto-Deploy)

## ⚠️ WICHTIG: Vor Merge zu `main`

Wenn dieser Branch zu `main` gemerged wird, wird automatisch deployed. Das Deployment:

1. ✅ Wird die neue `nginx-ssl.conf` deployen (Multi-Domain Support)
2. ✅ Wird die neue `docker-compose.production.yml` deployen (WordPress Network/Volume)
3. ⚠️ **Wird `docker-compose down` ausführen** (stoppt alle Container)
4. ⚠️ **Wird Container neu bauen und starten**

### Voraussetzungen für erfolgreiches Deployment

Das Deployment erfordert, dass auf dem Server existieren:

1. **Docker Network:** `wordpress-network`
   ```bash
   docker network ls | grep wordpress-network
   ```

2. **Docker Volume:** `production_wordpress_data`
   ```bash
   docker volume ls | grep production_wordpress_data
   ```

### Wenn Network/Volume fehlen

Das Deployment wird **fehlschlagen** mit Fehlern wie:
- `network wordpress-network declared as external, but could not be found`
- `volume production_wordpress_data declared as external, but could not be found`

## Lösungen

### Option 1: Manuell prüfen vor Merge

```bash
# Auf Server prüfen
ssh root@217.154.198.215
docker network ls | grep wordpress-network
docker volume ls | grep production_wordpress_data

# Falls fehlen, erstellen:
docker network create wordpress-network
docker volume create production_wordpress_data
```

### Option 2: Deployment-Script erweitern (empfohlen)

Das GitHub Actions Workflow sollte erweitert werden, um Network/Volume automatisch zu erstellen falls nicht vorhanden.

**Vorschlag:** Deployment-Step erweitern:

```yaml
- name: Ensure WordPress network and volume exist
  run: |
    ssh root@217.154.198.215 "
      docker network inspect wordpress-network >/dev/null 2>&1 || docker network create wordpress-network
      docker volume inspect production_wordpress_data >/dev/null 2>&1 || docker volume create production_wordpress_data
    "
```

## Empfehlung

**Jetzt:** Push auf `feature/project-integration` ist sicher ✅

**Vor Merge zu `main`:**
1. Prüfe ob Network/Volume existieren
2. Oder erweitere GitHub Actions Workflow (siehe Option 2)
3. Dann merge zu `main`

## Aktueller Workflow

```bash
# 1. Push auf Feature Branch (sicher)
git push origin feature/project-integration

# 2. Prüfe Server (vor Merge)
ssh root@217.154.198.215 "docker network ls | grep wordpress-network && docker volume ls | grep production_wordpress_data"

# 3. Wenn alles OK: Merge zu main (triggert Deployment)
git checkout main
git merge feature/project-integration
git push origin main  # ⚠️ Triggert Auto-Deploy!
```
